import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для админ-панели: получение данных участников и метрик
    """
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers_dict = event.get('headers', {})
    auth_header = headers_dict.get('authorization') or headers_dict.get('Authorization', '')
    
    admin_password = os.environ.get('ADMIN_PASSWORD', '')
    
    if not auth_header or auth_header != f"Bearer {admin_password}":
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', 'subscribers')
        
        if action == 'subscribers':
            return get_subscribers()
        elif action == 'metrics':
            return get_metrics()
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


def get_subscribers() -> Dict[str, Any]:
    """Получение списка всех участников"""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, email, name, promo_code, subscription_status, 
                   payment_amount, next_billing_date, created_at
            FROM subscribers
            ORDER BY created_at DESC
        """)
        
        rows = cur.fetchall()
        subscribers = []
        
        for row in rows:
            subscribers.append({
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'promo_code': row[3],
                'status': row[4],
                'amount': row[5],
                'next_billing': row[6].isoformat() if row[6] else None,
                'joined': row[7].isoformat() if row[7] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'subscribers': subscribers}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()


def get_metrics() -> Dict[str, Any]:
    """Расчёт ключевых метрик для дашборда"""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT COUNT(*) FROM subscribers WHERE subscription_status = 'active'")
        total_active = cur.fetchone()[0]
        
        mrr = total_active * 990
        
        week_ago = datetime.now() - timedelta(days=7)
        cur.execute(
            "SELECT COUNT(*) FROM subscribers WHERE created_at >= %s",
            (week_ago,)
        )
        new_this_week = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM payments WHERE status = 'completed'")
        total_payments = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT payment_id) FROM payments WHERE status = 'pending'")
        pending_payments = cur.fetchone()[0]
        
        conversion_rate = 0
        if total_payments + pending_payments > 0:
            conversion_rate = round((total_payments / (total_payments + pending_payments)) * 100, 2)
        
        cur.execute("""
            SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count
            FROM subscribers
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY day
            ORDER BY day DESC
        """)
        
        chart_data = []
        for row in cur.fetchall():
            chart_data.append({
                'date': row[0].isoformat(),
                'count': row[1]
            })
        
        metrics = {
            'total_active_subscribers': total_active,
            'mrr': mrr,
            'new_subscribers_week': new_this_week,
            'conversion_rate': conversion_rate,
            'chart_data': chart_data
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'metrics': metrics}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
