import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

type BrapiQuoteResponse = {
  results: Array<{
    symbol: string;
    shortName?: string;
    historicalDataPrice?: Array<{
      date: number;      // epoch seconds
      close: number;
      open?: number;
      high?: number;
      low?: number;
      volume?: number;
    }>;
  }>;
  error?: boolean;
  message?: string;
};

// API do Banco Central do Brasil (BCB) - Gratuita
type BcbSeriesResponse = Array<{
  data: string;      // DD/MM/YYYY
  valor: string;     // valor da série
}>;

export type SeriesPoint = { x: string; y: number };

@Injectable({ providedIn: 'root' })
export class EtfService {
  private baseUrl = 'https://brapi.dev/api';

  // Cache para evitar requests duplicadas
  private etfCache = new Map<string, SeriesPoint[]>();
  private selicCache: SeriesPoint[] | null = null;
  private inflationCache: SeriesPoint[] | null = null;
  private cdiCache: SeriesPoint[] | null = null;

  constructor(private http: HttpClient) {}

  // Limpar cache de benchmarks (útil para forçar atualização)
  clearBenchmarkCache(): void {
    this.selicCache = null;
    this.inflationCache = null;
    this.cdiCache = null;
    console.log('🗑️ Cache de benchmarks limpo!');
  }

  // Converter data DD/MM/YYYY para YYYY-MM-DD
  private convertBcbDateToIso(bcbDate: string): string {
    const [day, month, year] = bcbDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  getSelicLast3Months(): Observable<SeriesPoint[]> {
    // Retornar do cache se disponível
    if (this.selicCache) {
      return of(this.selicCache);
    }

    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const formatDate = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    // API do Banco Central - Série 11 (SELIC)
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json&dataInicial=${formatDate(threeMonthsAgo)}&dataFinal=${formatDate(today)}`;
    console.log('🔍 SELIC URL:', url);

    return this.http.get<BcbSeriesResponse>(url).pipe(
      map((res) => {
        console.log('✅ SELIC Raw Response:', res);
        console.log('🔍 First SELIC value:', res[0]?.valor, 'Last:', res[res.length-1]?.valor);
        const mapped = res.map(p => ({
          x: this.convertBcbDateToIso(p.data),
          y: parseFloat(p.valor) // BCB retorna % ao ano, ex: 5.5131 = 5.5131%
        }));
        console.log('✅ SELIC Mapped - First:', mapped[0], 'Last:', mapped[mapped.length-1]);
        return mapped;
      }),
      tap(data => this.selicCache = data)
    );
  }

  getInflationLast3Months(): Observable<SeriesPoint[]> {
    // Retornar do cache se disponível
    if (this.inflationCache) {
      return of(this.inflationCache);
    }

    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const formatDate = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    // API do Banco Central - Série 433 (IPCA)
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${formatDate(threeMonthsAgo)}&dataFinal=${formatDate(today)}`;
    console.log('🔍 IPCA URL:', url);

    return this.http.get<BcbSeriesResponse>(url).pipe(
      map((res) => {
        console.log('✅ IPCA Raw Response:', res);
        console.log('🔍 First CDI value:', res[0]?.valor, 'Last:', res[res.length-1]?.valor);
        const mapped = res.map(p => ({
          x: this.convertBcbDateToIso(p.data),
          y: parseFloat(p.valor) // BCB retorna % ao ano, ex: 14.9 = 14.9%
        }));
        console.log('✅ CDI Mapped - First:', mapped[0], 'Last:', mapped[mapped.length-1]);
        return mapped;
      }),
      tap(data => this.inflationCache = data)
    );
  }

  getCdiLast3Months(): Observable<SeriesPoint[]> {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const formatDate = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    // API do Banco Central - Série 12 (CDI)
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${formatDate(threeMonthsAgo)}&dataFinal=${formatDate(today)}`;
    console.log('🔍 CDI URL:', url);

    return this.http.get<BcbSeriesResponse>(url).pipe(
      map((res) => {
        console.log('✅ CDI Raw Response:', res);
        const mapped = res.map(p => ({
          x: this.convertBcbDateToIso(p.data),
          y: parseFloat(p.valor)
        }));
        console.log('✅ CDI Mapped:', mapped);
        return mapped;
      })
    );
  }

  getLast3Months(ticker: string): Observable<SeriesPoint[]> {
    // Retornar do cache se disponível
    if (this.etfCache.has(ticker)) {
      return of(this.etfCache.get(ticker)!);
    }

    const headers = environment.brapiToken
      ? new HttpHeaders({ Authorization: `Bearer ${environment.brapiToken}` })
      : undefined;

    const url = `${this.baseUrl}/quote/${encodeURIComponent(ticker)}?range=3mo&interval=1d`;

    return this.http.get<BrapiQuoteResponse>(url, { headers }).pipe(
      map((res) => {
        if ((res as any).error) {
          throw new Error((res as any).message || 'Erro ao consultar API');
        }
        const hist = res.results?.[0]?.historicalDataPrice ?? [];

        // Ordena por data crescente
        const sorted = [...hist].sort((a, b) => a.date - b.date);

        return sorted
          .filter(p => typeof p.close === 'number')
          .map(p => ({
            x: new Date(p.date * 1000).toISOString().slice(0, 10), // YYYY-MM-DD
            y: p.close
          }));
      }),
      tap(data => this.etfCache.set(ticker, data))
    );
  }

  searchStocks(query: string): Observable<Array<{ ticker: string; name: string; type: string }>> {
    const headers = environment.brapiToken
      ? new HttpHeaders({ Authorization: `Bearer ${environment.brapiToken}` })
      : undefined;

    const url = `${this.baseUrl}/quote/list?search=${encodeURIComponent(query)}&limit=10&type=fund`;

    return this.http.get<any>(url, { headers }).pipe(
      map((res) => {
        return res.stocks?.map((stock: any) => ({
          ticker: stock.stock,
          name: stock.name,
          type: stock.type
        })) || [];
      })
    );
  }
}
