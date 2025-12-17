import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';

interface Subscriber {
  id: number;
  email: string;
  name: string;
  promo_code: string;
  status: string;
  amount: number;
  next_billing: string;
  joined: string;
}

interface Metrics {
  total_active_subscribers: number;
  mrr: number;
  new_subscribers_week: number;
  conversion_rate: number;
  chart_data: Array<{ date: string; count: number }>;
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_API_URL = 'https://functions.poehali.dev/44a19460-5879-481c-aa91-67beb2d871aa';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${ADMIN_API_URL}?action=metrics`, {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        loadData(password);
      } else {
        setError('Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (authPassword: string) => {
    setLoading(true);
    try {
      const [subscribersRes, metricsRes] = await Promise.all([
        fetch(`${ADMIN_API_URL}?action=subscribers`, {
          headers: { 'Authorization': `Bearer ${authPassword}` }
        }),
        fetch(`${ADMIN_API_URL}?action=metrics`, {
          headers: { 'Authorization': `Bearer ${authPassword}` }
        })
      ]);

      if (subscribersRes.ok && metricsRes.ok) {
        const subscribersData = await subscribersRes.json();
        const metricsData = await metricsRes.json();
        
        setSubscribers(subscribersData.subscribers || []);
        setMetrics(metricsData.metrics || null);
      }
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && password) {
      const interval = setInterval(() => {
        loadData(password);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, password]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
              <Icon name="Lock" size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Админ-панель</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gradient-accent text-white" disabled={loading}>
              {loading ? 'Проверка...' : 'Войти'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
              <Icon name="LayoutDashboard" size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">НОМАД ХАБ - Админ-панель</h1>
          </div>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)} className="text-primary-foreground border-primary-foreground/30">
            Выйти
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-6 space-y-6">
        {metrics && (
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Users" size={24} className="text-accent" />
                <span className="text-3xl font-bold text-primary">{metrics.total_active_subscribers}</span>
              </div>
              <p className="text-muted-foreground text-sm">Активных участников</p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Icon name="TrendingUp" size={24} className="text-accent" />
                <span className="text-3xl font-bold text-primary">{metrics.mrr.toLocaleString()}₽</span>
              </div>
              <p className="text-muted-foreground text-sm">MRR (месячный доход)</p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Icon name="UserPlus" size={24} className="text-accent" />
                <span className="text-3xl font-bold text-primary">{metrics.new_subscribers_week}</span>
              </div>
              <p className="text-muted-foreground text-sm">Новых за неделю</p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Target" size={24} className="text-accent" />
                <span className="text-3xl font-bold text-primary">{metrics.conversion_rate}%</span>
              </div>
              <p className="text-muted-foreground text-sm">Конверсия</p>
            </Card>
          </div>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Все участники</h2>
            <Button onClick={() => loadData(password)} variant="outline" size="sm">
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Обновить
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Icon name="Loader2" size={48} className="animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Загрузка данных...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Промокод</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>След. списание</TableHead>
                    <TableHead>Дата вступления</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Пока нет участников
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.email}</TableCell>
                        <TableCell>{sub.name}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{sub.promo_code}</code>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell>{sub.amount}₽</TableCell>
                        <TableCell>{sub.next_billing ? new Date(sub.next_billing).toLocaleDateString('ru-RU') : '—'}</TableCell>
                        <TableCell>{new Date(sub.joined).toLocaleDateString('ru-RU')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
