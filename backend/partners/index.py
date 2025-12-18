import json
import os
from typing import Dict, Any, List
import requests
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для работы с партнёрами клуба: проверка доступа, получение списка партнёров из Airtable
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с request_id, function_name и другими атрибутами
    Returns: HTTP ответ с данными партнёров или результатом проверки доступа
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        email = body_data.get('email', '').strip().lower()
        
        if not email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email обязателен'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        try:
            cur.execute(
                f"SELECT status FROM t_p48299329_nomad_hub_landing.subscribers WHERE email = '{email}'"
            )
            result = cur.fetchone()
            
            authorized = result is not None and result[0] == 'active'
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'authorized': authorized}),
                'isBase64Encoded': False
            }
        finally:
            cur.close()
            conn.close()
    
    if method == 'GET':
        airtable_token = os.environ.get('AIRTABLE_TOKEN')
        base_id = os.environ.get('AIRTABLE_BASE_ID')
        table_name = os.environ.get('AIRTABLE_TABLE_NAME', 'Partners')
        
        if not airtable_token or not base_id:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'partners': []}),
                'isBase64Encoded': False
            }
        
        url = f'https://api.airtable.com/v0/{base_id}/{table_name}'
        headers = {
            'Authorization': f'Bearer {airtable_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'partners': []}),
                'isBase64Encoded': False
            }
        
        data = response.json()
        partners: List[Dict[str, Any]] = []
        
        for record in data.get('records', []):
            fields = record.get('fields', {})
            partners.append({
                'id': record['id'],
                'name': fields.get('Name', ''),
                'logo': fields.get('Logo', [{}])[0].get('url', '') if fields.get('Logo') else '',
                'description': fields.get('Description', ''),
                'category': fields.get('Category', 'Быт'),
                'offer': fields.get('Offer', ''),
                'promoCode': fields.get('PromoCode', ''),
                'url': fields.get('URL', ''),
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'partners': partners}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }