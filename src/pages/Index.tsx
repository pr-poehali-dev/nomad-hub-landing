import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('hero');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState('');
  const [paymentName, setPaymentName] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const PAYMENT_API_URL = 'https://functions.poehali.dev/ddaf75cf-41a8-4f00-80ea-7d688cd89271';

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Спасибо за обращение!",
      description: "Мы свяжемся с вами в ближайшее время.",
    });
    setEmail('');
    setMessage('');
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const response = await fetch(PAYMENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_payment',
          email: paymentEmail,
          name: paymentName,
          return_url: window.location.origin + '/success'
        })
      });

      const data = await response.json();

      if (response.ok && data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        toast({
          title: "Ошибка оплаты",
          description: data.error || "Попробуйте позже",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Ошибка соединения",
        description: "Проверьте интернет и попробуйте снова",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full bg-primary/95 backdrop-blur-sm z-50 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                <Icon name="Compass" size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-primary-foreground">НОМАД ХАБ</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Главная
              </button>
              <button
                onClick={() => scrollToSection('value')}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Ценность
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Как это работает
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Тарифы
              </button>
              <button
                onClick={() => scrollToSection('contacts')}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Контакты
              </button>
              <a
                href="/partners"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Партнёры
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section id="hero" className="pt-32 pb-20 px-4 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary-foreground mb-6 leading-tight">
              Система выживания и роста для нового профессионала
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 leading-relaxed">
              Доступ к работе, комьюнити и бытовому сервису по одной подписке
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="gradient-accent text-white font-semibold px-8 py-6 text-lg hover:scale-105 transition-transform shadow-xl"
                onClick={() => scrollToSection('pricing')}
              >
                Начать за 990₽/месяц
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm text-primary-foreground border-primary-foreground/30 hover:bg-white/20 px-8 py-6 text-lg"
                onClick={() => scrollToSection('value')}
              >
                Узнать подробнее
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="value" className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
            Что вы получаете
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-border animate-scale-in">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mb-6">
                <Icon name="Briefcase" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">База эксклюзивных проектов</h3>
              <p className="text-muted-foreground leading-relaxed">
                Доступ к проверенным вакансиям и проектам для фрилансеров. Только качественные предложения от надежных заказчиков.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-border animate-scale-in [animation-delay:200ms]">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mb-6">
                <Icon name="Users" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Онлайн-сессии с экспертами</h3>
              <p className="text-muted-foreground leading-relaxed">
                Живые вебинары и записи в архиве. Обучайтесь у лучших специалистов индустрии и развивайте свои навыки.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-border animate-scale-in [animation-delay:400ms]">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mb-6">
                <Icon name="Sparkles" size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Скидки от партнеров</h3>
              <p className="text-muted-foreground leading-relaxed">
                Быстрый заказ услуг со скидками: курьеры, клининг, психологи. Всё необходимое для комфортной жизни в одном месте.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
            Как это работает
          </h2>
          <div className="space-y-8">
            {[
              {
                step: 1,
                icon: 'CreditCard',
                title: 'Оплатил подписку',
                description: 'Выберите тариф Core Member за 990₽ в месяц и оплатите удобным способом.',
              },
              {
                step: 2,
                icon: 'Mail',
                title: 'Получил приглашение',
                description: 'После оплаты вы автоматически получите письмо с доступом к закрытому Telegram-чату.',
              },
              {
                step: 3,
                icon: 'Menu',
                title: 'Выбрал нужный сервис',
                description: 'В меню бота найдите все доступные сервисы: проекты, вебинары, партнёрские скидки.',
              },
              {
                step: 4,
                icon: 'Rocket',
                title: 'Используешь',
                description: 'Пользуйтесь всеми преимуществами клуба и развивайте свой бизнес вместе с нами!',
              },
            ].map((item, index) => (
              <Card key={item.step} className="p-8 flex gap-6 items-start hover:shadow-xl transition-all animate-slide-in" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon name={item.icon as any} size={28} className="text-accent" />
                    <h3 className="text-2xl font-bold text-primary">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
            Тарифы
          </h2>
          <Card className="p-10 border-4 border-accent shadow-2xl relative overflow-hidden animate-scale-in">
            <div className="absolute top-0 right-0 bg-accent text-white px-6 py-2 text-sm font-bold rounded-bl-2xl">
              ПОПУЛЯРНЫЙ
            </div>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2 text-primary">Core Member</h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-6xl font-extrabold text-accent">990₽</span>
                <span className="text-xl text-muted-foreground">/месяц</span>
              </div>
            </div>
            <div className="space-y-4 mb-8">
              {[
                'Доступ в закрытый Telegram-чат',
                'База эксклюзивных проектов и вакансий',
                'Архив всех вебинаров и сессий',
                'Скидки 5-15% от партнеров',
                'Техническая поддержка 24/7',
                'Приоритетные уведомления о новых проектах',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="Check" size={16} className="text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="w-full gradient-accent text-white font-semibold text-lg py-6 hover:scale-105 transition-transform shadow-xl"
              onClick={() => setShowPaymentModal(true)}
            >
              Купить подписку
            </Button>
          </Card>
        </div>
      </section>

      <section id="contacts" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
            Контакты
          </h2>
          <Card className="p-8 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-foreground">
                  Сообщение
                </label>
                <Textarea
                  id="message"
                  placeholder="Ваш вопрос или предложение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full"
                />
              </div>
              <Button type="submit" size="lg" className="w-full gradient-accent text-white font-semibold">
                Отправить сообщение
              </Button>
            </form>
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-xl font-semibold mb-4 text-center text-primary">Мы в соцсетях</h3>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" className="rounded-full w-12 h-12 hover:bg-accent hover:text-white transition-colors">
                  <Icon name="MessageCircle" size={20} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full w-12 h-12 hover:bg-accent hover:text-white transition-colors">
                  <Icon name="Send" size={20} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full w-12 h-12 hover:bg-accent hover:text-white transition-colors">
                  <Icon name="Mail" size={20} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="bg-primary py-8 px-4">
        <div className="container mx-auto text-center text-primary-foreground/80">
          <p className="mb-2">© 2024 НОМАД ХАБ. Все права защищены.</p>
          <p className="text-sm">Закрытый клуб для фрилансеров и digital-кочевников</p>
        </div>
      </footer>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Оформление подписки</DialogTitle>
            <DialogDescription>
              Заполните данные для оплаты подписки Core Member за 990₽/месяц
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label htmlFor="payment-name" className="block text-sm font-medium mb-2">
                Ваше имя
              </label>
              <Input
                id="payment-name"
                type="text"
                placeholder="Иван Иванов"
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="payment-email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="payment-email"
                type="email"
                placeholder="your@email.com"
                value={paymentEmail}
                onChange={(e) => setPaymentEmail(e.target.value)}
                required
              />
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Подписка Core Member</span>
                <span className="font-bold text-lg">990₽</span>
              </div>
              <p className="text-xs text-muted-foreground">
                После оплаты вы получите письмо с доступом к закрытому чату и персональным промокодом
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full gradient-accent text-white font-semibold"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                  Обработка...
                </>
              ) : (
                'Перейти к оплате'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}