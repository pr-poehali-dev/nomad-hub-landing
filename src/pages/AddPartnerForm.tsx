import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface AddPartnerFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPartnerForm({ open, onClose, onSuccess }: AddPartnerFormProps) {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Быт');
  const [offer, setOffer] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [url, setUrl] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/d2b62114-df23-487b-b0ce-23b330969373', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword,
        },
        body: JSON.stringify({
          name,
          logo,
          description,
          category,
          offer,
          promoCode,
          url,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Партнёр добавлен!',
          description: 'Новый партнёр появится в каталоге',
        });
        setName('');
        setLogo('');
        setDescription('');
        setCategory('Быт');
        setOffer('');
        setPromoCode('');
        setUrl('');
        setAdminPassword('');
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось добавить партнёра',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить партнёра',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Добавить партнёра
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о новом партнёре клуба
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="partner-name" className="block text-sm font-medium mb-2">
                Название компании *
              </label>
              <Input
                id="partner-name"
                type="text"
                placeholder="Название партнёра"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="partner-category" className="block text-sm font-medium mb-2">
                Категория *
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Здоровье">Здоровье</SelectItem>
                  <SelectItem value="Быт">Быт</SelectItem>
                  <SelectItem value="Образование">Образование</SelectItem>
                  <SelectItem value="Юридическое">Юридическое</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="partner-logo" className="block text-sm font-medium mb-2">
              URL логотипа
            </label>
            <Input
              id="partner-logo"
              type="url"
              placeholder="https://example.com/logo.png"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="partner-description" className="block text-sm font-medium mb-2">
              Описание *
            </label>
            <Textarea
              id="partner-description"
              placeholder="Краткое описание услуг партнёра"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="partner-offer" className="block text-sm font-medium mb-2">
              Специальное предложение *
            </label>
            <Textarea
              id="partner-offer"
              placeholder="Например: Уборка 1-комнатной квартиры за 1990₽ вместо 2500₽"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="partner-promo" className="block text-sm font-medium mb-2">
                Промокод *
              </label>
              <Input
                id="partner-promo"
                type="text"
                placeholder="NOMAD2024"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div>
              <label htmlFor="partner-url" className="block text-sm font-medium mb-2">
                Ссылка на партнёра *
              </label>
              <Input
                id="partner-url"
                type="url"
                placeholder="https://partner-site.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <label htmlFor="admin-password" className="block text-sm font-medium mb-2">
              Пароль администратора *
            </label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Введите пароль админа"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-accent text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                  Добавление...
                </>
              ) : (
                'Добавить партнёра'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
