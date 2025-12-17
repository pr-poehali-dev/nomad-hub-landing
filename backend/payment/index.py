import json
import os
import base64
import psycopg2
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Обработка платежей через ЮKassa и автоматическая отправка welcome-писем
    """
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'create_payment':
            return create_payment(body_data)
        elif action == 'webhook':
            return handle_webhook(body_data)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }


def create_payment(data: Dict[str, Any]) -> Dict[str, Any]:
    """Создание платежа в ЮKassa"""
    email = data.get('email')
    name = data.get('name', 'Участник')
    
    if not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email is required'}),
            'isBase64Encoded': False
        }
    
    shop_id = os.environ.get('YUKASSA_SHOP_ID')
    secret_key = os.environ.get('YUKASSA_SECRET_KEY')
    
    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Payment configuration missing'}),
            'isBase64Encoded': False
        }
    
    idempotence_key = str(uuid.uuid4())
    
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = auth_string.encode('utf-8')
    auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
    
    payment_data = {
        "amount": {
            "value": "990.00",
            "currency": "RUB"
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": data.get('return_url', 'https://nomad-hub.example.com/success')
        },
        "description": "Подписка НОМАД ХАБ Core Member",
        "metadata": {
            "email": email,
            "name": name
        }
    }
    
    response = requests.post(
        'https://api.yookassa.ru/v3/payments',
        json=payment_data,
        headers={
            'Authorization': f'Basic {auth_b64}',
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        }
    )
    
    if response.status_code == 200:
        payment_info = response.json()
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        try:
            cur.execute(
                "INSERT INTO payments (payment_id, amount, status, metadata) VALUES (%s, %s, %s, %s)",
                (payment_info['id'], 990, 'pending', json.dumps({'email': email, 'name': name}))
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Database error: {e}")
        finally:
            cur.close()
            conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'payment_id': payment_info['id'],
                'confirmation_url': payment_info['confirmation']['confirmation_url']
            }),
            'isBase64Encoded': False
        }
    else:
        return {
            'statusCode': response.status_code,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Payment creation failed', 'details': response.text}),
            'isBase64Encoded': False
        }


def handle_webhook(data: Dict[str, Any]) -> Dict[str, Any]:
    """Обработка webhook от ЮKassa после успешной оплаты"""
    payment_data = data.get('object', {})
    status = payment_data.get('status')
    payment_id = payment_data.get('id')
    metadata = payment_data.get('metadata', {})
    
    if status == 'succeeded':
        email = metadata.get('email')
        name = metadata.get('name', 'Участник')
        
        promo_code = generate_promo_code()
        telegram_link = os.environ.get('TELEGRAM_CHAT_LINK', 'https://t.me/nomad_hub')
        next_billing = datetime.now() + timedelta(days=30)
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        try:
            cur.execute(
                """INSERT INTO subscribers (email, name, promo_code, payment_id, next_billing_date, telegram_chat_link)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   ON CONFLICT (email) DO UPDATE SET
                   payment_id = EXCLUDED.payment_id,
                   next_billing_date = EXCLUDED.next_billing_date,
                   subscription_status = 'active'
                   RETURNING id""",
                (email, name, promo_code, payment_id, next_billing, telegram_link)
            )
            subscriber_id = cur.fetchone()[0]
            
            cur.execute(
                "UPDATE payments SET status = %s, subscriber_id = %s, completed_at = %s WHERE payment_id = %s",
                ('completed', subscriber_id, datetime.now(), payment_id)
            )
            conn.commit()
            
            send_welcome_email(email, name, promo_code, telegram_link)
            
        except Exception as e:
            conn.rollback()
            print(f"Webhook processing error: {e}")
        finally:
            cur.close()
            conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'status': 'ok'}),
        'isBase64Encoded': False
    }


def generate_promo_code() -> str:
    """Генерация уникального промокода"""
    return f"NOMAD{uuid.uuid4().hex[:8].upper()}"


def send_welcome_email(email: str, name: str, promo_code: str, telegram_link: str):
    """Отправка welcome-письма через SendGrid"""
    api_key = os.environ.get('SENDGRID_API_KEY')
    
    if not api_key:
        print("SendGrid API key not configured")
        return
    
    message = {
        "personalizations": [{
            "to": [{"email": email, "name": name}],
            "subject": "Добро пожаловать в НОМАД ХАБ! 🚀"
        }],
        "from": {"email": "welcome@nomad-hub.com", "name": "НОМАД ХАБ"},
        "content": [{
            "type": "text/html",
            "value": f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h1 style="color: #E07A5F;">Добро пожаловать в НОМАД ХАБ!</h1>
                <p>Привет, {name}! 👋</p>
                <p>Спасибо за подписку на Core Member. Теперь у вас есть доступ ко всем возможностям клуба!</p>
                
                <h2 style="color: #0F1A2B;">Ваша ссылка для вступления в закрытый чат:</h2>
                <p><a href="{telegram_link}" style="background: #E07A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Вступить в Telegram-чат</a></p>
                
                <h2 style="color: #0F1A2B;">Ваш личный код для скидок у партнёров:</h2>
                <p style="font-size: 24px; font-weight: bold; color: #E07A5F; background: #F4F1DE; padding: 16px; border-radius: 8px; display: inline-block;">{promo_code}</p>
                
                <p>Используйте этот код для получения скидок 5-15% у наших партнёров!</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;">
                
                <h3>Что дальше?</h3>
                <ul>
                    <li>Присоединяйтесь к Telegram-чату и знакомьтесь с сообществом</li>
                    <li>Изучайте базу эксклюзивных проектов</li>
                    <li>Смотрите записи вебинаров в архиве</li>
                    <li>Пользуйтесь скидками от партнёров</li>
                </ul>
                
                <p>Если у вас есть вопросы, просто ответьте на это письмо!</p>
                
                <p style="margin-top: 32px;">С уважением,<br><strong>Команда НОМАД ХАБ</strong></p>
            </body>
            </html>
            """
        }]
    }
    
    try:
        response = requests.post(
            'https://api.sendgrid.com/v3/mail/send',
            json=message,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        )
        if response.status_code == 202:
            print(f"Welcome email sent to {email}")
        else:
            print(f"Email sending failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Email error: {e}")
