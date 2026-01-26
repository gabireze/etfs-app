import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EtfService, SeriesPoint } from '../services/etf.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { forkJoin, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

type EtfItem = { ticker: string; name: string };
type EtfCategory = { name: string; etfs: EtfItem[] };
type EtfData = { categories: EtfCategory[] };

@Component({
  selector: 'app-etf-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './etf-chart.component.html',
  styleUrls: ['./etf-chart.component.css']
})
export class EtfChartComponent implements OnInit {
  categories: EtfCategory[] = [];
  customEtfs: EtfItem[] = [];
  selectedTickers: string[] = [];
  loading = false;
  loadingList = false;
  error: string | null = null;

  // Pesos da carteira (percentual para cada ETF)
  portfolioWeights: Map<string, number> = new Map();

  // Benchmarks sempre ativos
  showSelic = true;
  showInflation = true;

  // Métricas de performance
  portfolioReturn = 0;
  selicReturn = 0;
  inflationReturn = 0;
  showPerformance = false;

  // Expor Array para uso no template
  Array = Array;

  // Tema
  isDarkTheme = false;

  // Busca de ETFs
  searchQuery = '';
  searchResults: Array<{ ticker: string; name: string; type: string }> = [];
  isSearching = false;
  private searchSubject = new Subject<string>();

  getTotalWeight(): number {
    let total = 0;
    this.portfolioWeights.forEach(weight => total += weight);
    return total;
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  // Array de cores para diferenciar os ETFs
  private colors = [
    { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.2)' },
    { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.2)' },
    { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.2)' },
    { border: 'rgb(199, 199, 199)', background: 'rgba(199, 199, 199, 0.2)' },
    { border: 'rgb(83, 102, 255)', background: 'rgba(83, 102, 255, 0.2)' },
  ];

  // ng2-charts (Chart.js) - Gráfico 1: Preços Absolutos
  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false // Título removido - está no HTML
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += 'R$ ' + context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Data'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Preço (R$)'
        }
      }
    }
  };

  // Gráfico 2: Retorno Acumulado (%)
  returnsChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  returnsChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value !== null ? value.toFixed(2) : 'N/A'}%`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Data'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Retorno Acumulado (%)'
        }
      }
    }
  };

  constructor(
    private http: HttpClient,
    private etfService: EtfService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  clearCache(): void {
    this.etfService.clearBenchmarkCache();
    // Forçar recarga se houver seleção ativa
    if (this.selectedTickers.length > 0) {
      this.onSelectionChange(this.selectedTickers);
    }
  }

  // Verificar se ticker está em alguma categoria pré-definida
  isTickerInCategories(ticker: string): boolean {
    return this.categories.some(cat =>
      cat.etfs.some(etf => etf.ticker.toUpperCase() === ticker.toUpperCase())
    );
  }

  // Verificar se ticker está selecionado
  isTickerSelected(ticker: string): boolean {
    return this.selectedTickers.includes(ticker);
  }

  // Toggle de seleção (para categorias e personalizados)
  toggleTickerSelection(ticker: string): void {
    const index = this.selectedTickers.indexOf(ticker);
    if (index > -1) {
      // Desselecionar
      this.selectedTickers.splice(index, 1);
      this.portfolioWeights.delete(ticker);
    } else {
      // Selecionar
      this.selectedTickers.push(ticker);
    }
    this.redistributeWeights();
    this.onSelectionChange(this.selectedTickers);
  }

  // Selecionar resultado de busca
  selectSearchResult(result: { ticker: string; name: string; type: string }): void {
    const ticker = result.ticker.toUpperCase();

    // Se já está nas categorias pré-definidas, apenas ativar/desativar
    if (this.isTickerInCategories(ticker)) {
      this.toggleTickerSelection(ticker);
    } else {
      // Verificar se já está em personalizados
      const existsInCustom = this.customEtfs.some(etf => etf.ticker === ticker);

      if (!existsInCustom) {
        // Adicionar aos personalizados
        this.customEtfs.push({
          ticker: ticker,
          name: result.name
        });
      }

      // Ativar se ainda não está selecionado
      if (!this.isTickerSelected(ticker)) {
        this.toggleTickerSelection(ticker);
      }
    }

    // Limpar busca
    this.searchQuery = '';
    this.searchResults = [];
  }

  // Remover ETF personalizado
  removeCustomEtf(ticker: string): void {
    // Desselecionar se estiver selecionado
    if (this.isTickerSelected(ticker)) {
      this.toggleTickerSelection(ticker);
    }

    // Remover da lista de personalizados
    this.customEtfs = this.customEtfs.filter(etf => etf.ticker !== ticker);
  }

  redistributeWeights(): void {
    const count = this.selectedTickers.length;
    if (count > 0) {
      const equalWeight = 100 / count;
      this.selectedTickers.forEach(ticker => {
        this.portfolioWeights.set(ticker, equalWeight);
      });
    }
  }

  onWeightChange(ticker: string, value: number): void {
    this.portfolioWeights.set(ticker, value);
    this.onSelectionChange(this.selectedTickers);
  }

  onBenchmarkChange(): void {
    this.onSelectionChange(this.selectedTickers);
  }

  ngOnInit(): void {
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';

    // Configurar busca com debouncing
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          return new Observable<Array<{ ticker: string; name: string; type: string }>>(observer => {
            observer.next([]);
            observer.complete();
          });
        }
        this.isSearching = true;
        return this.etfService.searchStocks(query);
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.searchResults = [];
        this.isSearching = false;
        this.cdr.markForCheck();
      }
    });

    this.loadingList = true;
    this.http.get<EtfData>('/etfs.json').subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.loadingList = false;
        this.cdr.markForCheck();

        // Mostrar gráficos apenas com benchmarks (sem ETFs selecionados)
        setTimeout(() => {
          this.onSelectionChange([]);
        }, 0);
      },
      error: (err) => {
        this.error = 'Falha ao carregar lista de ETFs';
        this.loadingList = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  onSelectionChange(tickers: string[]): void {
    this.selectedTickers = tickers;
    this.loading = true;
    this.error = null;
    this.lineChartData = { labels: [], datasets: [] };
    this.returnsChartData = { labels: [], datasets: [] };
    this.showPerformance = false;

    // Buscar dados de todos os ETFs selecionados (pode ser vazio)
    const requests = tickers.map(ticker =>
      this.etfService.getLast3Months(ticker)
    );

    // Adicionar benchmarks se selecionados
    const benchmarkRequests: Observable<SeriesPoint[]>[] = [];
    const benchmarkLabels: string[] = [];

    if (this.showSelic) {
      benchmarkRequests.push(this.etfService.getSelicLast3Months());
      benchmarkLabels.push('SELIC');
    }
    if (this.showInflation) {
      benchmarkRequests.push(this.etfService.getInflationLast3Months());
      benchmarkLabels.push('IPCA');
    }

    const allRequests = [...requests, ...benchmarkRequests];
    console.log('🔍 Total requests:', allRequests.length, 'ETFs:', tickers.length, 'Benchmarks:', benchmarkRequests.length);

    // Se não houver nenhuma requisição, finalizar
    if (allRequests.length === 0) {
      this.loading = false;
      return;
    }

    // Usar forkJoin para aguardar todas as requisições
    forkJoin(allRequests).subscribe({
        next: (results: SeriesPoint[][]) => {
          console.log('✅ All results received:', results);
          this.ngZone.run(() => {
            const etfResults = results.slice(0, tickers.length);
            const benchmarkResults = results.slice(tickers.length);
            console.log('📊 ETF Results:', etfResults.length, 'Benchmark Results:', benchmarkResults.length);

            // Coletar todas as datas únicas
            const allDates = new Set<string>();
            etfResults.forEach(points => {
              points.forEach(p => allDates.add(p.x));
            });
            benchmarkResults.forEach(points => {
              points.forEach(p => allDates.add(p.x));
            });
            const sortedDates = Array.from(allDates).sort();
            console.log('📅 Unique dates:', sortedDates.length);

            // ========== GRÁFICO 1: PREÇOS ABSOLUTOS (SEM BENCHMARKS) ==========
            const priceDatasets: any[] = [];

            // Adicionar ETFs com preços em R$
            etfResults.forEach((points, index) => {
              const ticker = tickers[index];
              const colorIndex = index % this.colors.length;
              const color = this.colors[colorIndex];
              const dataMap = new Map(points.map(p => [p.x, p.y]));

              const data = sortedDates.map(date => dataMap.get(date) || null);

              priceDatasets.push({
                data,
                label: `${ticker} (R$)`,
                fill: false,
                tension: 0.1,
                borderColor: color.border,
                backgroundColor: color.background,
                spanGaps: true
              });
            });

            this.lineChartData = {
              labels: sortedDates,
              datasets: priceDatasets
            };

            // ========== GRÁFICO 2: RETORNO ACUMULADO COM BENCHMARKS ==========
            const returnsDatasets: any[] = [];

            // Calcular evolução da carteira ponderada
            const portfolioEvolution = this.calculatePortfolioEvolution(etfResults, tickers, sortedDates);

            // Adicionar carteira ponderada
            returnsDatasets.push({
              data: portfolioEvolution.values,
              label: 'Carteira',
              fill: false,
              tension: 0.1,
              borderColor: 'rgb(0, 0, 0)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderWidth: 3,
              spanGaps: true
            });

            // Adicionar ETFs individuais em %
            etfResults.forEach((points, index) => {
              const ticker = tickers[index];
              const colorIndex = index % this.colors.length;
              const color = this.colors[colorIndex];

              const firstPrice = points[0]?.y;
              const dataMap = new Map(points.map(p => [p.x, p.y]));

              // Converter para % de retorno acumulado
              const data = sortedDates.map(date => {
                const price = dataMap.get(date);
                if (price && firstPrice) {
                  return ((price - firstPrice) / firstPrice) * 100;
                }
                return null;
              });

              returnsDatasets.push({
                data,
                label: `${ticker}`,
                fill: false,
                tension: 0.1,
                borderColor: color.border,
                backgroundColor: color.background,
                spanGaps: true
              });
            });

            // Adicionar benchmarks - converter taxas em retorno acumulado %
            benchmarkResults.forEach((points, index) => {
              const benchmarkName = benchmarkLabels[index];
              const isMonthlyRate = benchmarkName === 'IPCA'; // IPCA é taxa mensal
              const dataMap = new Map(points.map(p => [p.x, p.y]));

              console.log(`📊 Benchmark ${benchmarkName} - First value:`, points[0], 'Last:', points[points.length-1]);

              // Calcular retorno acumulado começando de 0%
              let accumulated = 1.0;
              let lastRate = 0; // Última taxa conhecida
              let lastMonthApplied = ''; // Para IPCA, controlar qual mês já foi aplicado

              const data = sortedDates.map(date => {
                const ratePercent = dataMap.get(date);

                // Se existe taxa para essa data, atualiza lastRate
                if (ratePercent !== undefined && ratePercent !== null) {
                  lastRate = ratePercent;
                }

                // Se temos alguma taxa (atual ou última conhecida), acumula
                if (lastRate > 0) {
                  if (isMonthlyRate) {
                    // IPCA: Taxa MENSAL - aplicar apenas uma vez por mês
                    const currentMonth = date.substring(0, 7); // 'YYYY-MM'
                    if (currentMonth !== lastMonthApplied) {
                      // Nova taxa mensal: aplicar uma única vez
                      const monthlyRate = lastRate / 100;
                      accumulated *= (1 + monthlyRate);
                      lastMonthApplied = currentMonth;
                    }
                  } else {
                    // SELIC/CDI: Taxa DIÁRIA - aplicar a cada dia
                    // BCB série 11/12 retorna taxa diária já em formato %
                    // Ex: 0.055131 = 0.055131% ao dia
                    const dailyRate = lastRate / 100;
                    accumulated *= (1 + dailyRate);
                  }
                  return (accumulated - 1) * 100;
                }

                return 0; // Ainda não começou
              });

              console.log(`📈 Benchmark ${benchmarkName} - accumulated data:`,
                'First:', data[0]?.toFixed(4),
                'Middle:', data[Math.floor(data.length/2)]?.toFixed(4),
                'Last:', data[data.length-1]?.toFixed(4));

              const colors = [
                { border: 'rgb(255, 159, 64)', bg: 'rgba(255, 159, 64, 0.2)' },   // SELIC - laranja
                { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },   // CDI - vermelho
                { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.2)' }  // IPCA - roxo
              ];

              returnsDatasets.push({
                data,
                label: benchmarkLabels[index],
                fill: false,
                tension: 0.1,
                borderColor: colors[index].border,
                backgroundColor: colors[index].bg,
                borderDash: [5, 5],
                spanGaps: false // Não pular lacunas - linha contínua
              });
            });

            this.returnsChartData = {
              labels: sortedDates,
              datasets: returnsDatasets
            };

            // Calcular performance
            this.calculatePerformance(portfolioEvolution, benchmarkResults);

            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (e) => {
          this.ngZone.run(() => {
            this.error = e?.message || 'Erro ao buscar histórico';
            this.loading = false;
          });
        }
      });
  }

  calculatePortfolioEvolution(etfResults: SeriesPoint[][], tickers: string[], dates: string[]): { values: (number | null)[], finalReturn: number } {
    const values: (number | null)[] = [];

    dates.forEach((date, dateIndex) => {
      let portfolioReturn = 0;
      let hasAllData = true;

      tickers.forEach((ticker, tickerIndex) => {
        const weight = this.portfolioWeights.get(ticker) || 0;
        const points = etfResults[tickerIndex];
        const dataMap = new Map(points.map(p => [p.x, p.y]));

        const currentPrice = dataMap.get(date);
        const firstPrice = points[0]?.y;

        if (currentPrice && firstPrice) {
          const returns = ((currentPrice - firstPrice) / firstPrice) * 100; // % de retorno
          portfolioReturn += returns * (weight / 100); // Retorno ponderado
        } else {
          hasAllData = false;
        }
      });

      values.push(hasAllData ? portfolioReturn : null);
    });

    // Buscar o último valor válido (não-null)
    let finalReturn = 0;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== null) {
        finalReturn = values[i]!;
        break;
      }
    }

    console.log('💰 Portfolio Return Calculation:', {
      totalDates: dates.length,
      validValues: values.filter(v => v !== null).length,
      lastValue: values[values.length - 1],
      finalReturn
    });

    return { values, finalReturn };
  }

  calculatePerformance(portfolioEvolution: { values: (number | null)[], finalReturn: number }, benchmarkResults: SeriesPoint[][]): void {
    this.portfolioReturn = portfolioEvolution.finalReturn;

    // IMPORTANTE: Os valores dos benchmarks agora são calculados diretamente no gráfico
    // de retornos acumulados (returnsChartData). Aqui apenas extraímos o último valor
    // de cada dataset de benchmark que já foi acumulado corretamente.

    // Buscar os datasets de benchmark no gráfico de retornos acumulados
    if (this.returnsChartData && this.returnsChartData.datasets) {
      const benchmarkDatasets = this.returnsChartData.datasets.filter(ds =>
        ds.label === 'SELIC' || ds.label === 'CDI' || ds.label === 'IPCA'
      );

      benchmarkDatasets.forEach(dataset => {
        const data = dataset.data as (number | null)[];
        const lastValue = data[data.length - 1];

        if (lastValue !== null && lastValue !== undefined) {
          if (dataset.label === 'SELIC') {
            this.selicReturn = lastValue;
          } else if (dataset.label === 'IPCA') {
            this.inflationReturn = lastValue;
          }
        }
      });
    }

    this.showPerformance = true;
  }
}
