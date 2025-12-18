import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import AddPartnerForm from './AddPartnerForm';

interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  offer: string;
  promoCode: string;
  url: string;
}

export default function Partners() {
  const [email, setEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const categories = ['Все', 'Здоровье', 'Быт', 'Образование', 'Юридическое'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/0ba101c6-edbb-4c53-947b-65f0d4c639ec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.authorized) {
        setIsAuthorized(true);
        sessionStorage.setItem('partnerAuth', email);
        toast({
          title: 'Добро пожаловать!',
          description: 'Доступ к разделу партнёров открыт',
        });
      } else {
        toast({
          title: 'Доступ запрещён',
          description: 'Этот раздел доступен только участникам клуба',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить доступ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('partnerAuth');
    if (savedAuth) {
      setEmail(savedAuth);
      setIsAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadPartners();
    }
  }, [isAuthorized]);

  const loadPartners = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/0ba101c6-edbb-4c53-947b-65f0d4c639ec');
      const data = await response.json();
      setPartners(data.partners || []);
    } catch (error) {
      console.error('Failed to load partners:', error);
    }
  };

  const filteredPartners = selectedCategory === 'Все'
    ? partners
    : partners.filter(p => p.category === selectedCategory);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Lock" size={32} className="text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Раздел партнёров
            </h1>
            <p className="text-muted-foreground">
              Доступ только для участников НОМАД ХАБ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium mb-2">
                Ваш email
              </label>
              <Input
                id="auth-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-accent text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                  Проверка...
                </>
              ) : (
                'Войти'
              )}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Партнёры НОМАД ХАБ</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-80">{email}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-primary-foreground/20 hover:bg-primary-foreground/10"
              onClick={() => {
                setIsAuthorized(false);
                sessionStorage.removeItem('partnerAuth');
              }}
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">
              Эксклюзивные предложения для участников
            </h2>
            <p className="text-muted-foreground">
              Скидки и специальные условия от проверенных партнёров
            </p>
          </div>
          <Button
            className="gradient-accent text-white font-semibold"
            onClick={() => setShowAddForm(true)}
          >
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить партнёра
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={selectedCategory === category ? 'gradient-accent text-white' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {partner.logo ? (
                    <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="Store" size={32} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-primary mb-1">{partner.name}</h3>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                    {partner.category}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {partner.description}
              </p>

              <div className="bg-accent/5 border-l-4 border-accent p-3 rounded mb-4">
                <p className="text-sm font-semibold text-foreground">{partner.offer}</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">Промокод:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-1 rounded font-mono text-sm font-bold">
                    {partner.promoCode}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(partner.promoCode);
                      toast({
                        title: 'Скопировано!',
                        description: 'Промокод добавлен в буфер обмена',
                      });
                    }}
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full gradient-accent text-white font-semibold"
                onClick={() => window.open(partner.url, '_blank')}
              >
                Перейти к партнёру
                <Icon name="ExternalLink" size={16} className="ml-2" />
              </Button>
            </Card>
          ))}
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Package" size={48} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Партнёры скоро появятся
            </h3>
            <p className="text-muted-foreground">
              Мы работаем над добавлением эксклюзивных предложений
            </p>
          </div>
        )}
      </main>

      <AddPartnerForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          loadPartners();
        }}
      />
    </div>
  );
}