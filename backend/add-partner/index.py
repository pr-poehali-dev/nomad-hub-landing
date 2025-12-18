import json
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для добавления нового партнёра в Airtable (только для админа)
    Args: event - dict с httpMethod, body с данными партнёра
          context - объект с request_id, function_name и другими атрибутами
    Returns: HTTP ответ с результатом добавления партнёра
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    admin_password = headers.get('x-admin-password', headers.get('X-Admin-Password', ''))
    
    if admin_password != os.environ.get('ADMIN_PASSWORD'):
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Forbidden'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    required_fields = ['name', 'description', 'category', 'offer', 'promoCode', 'url']
    for field in required_fields:
        if not body_data.get(field):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Поле {field} обязательно'}),
                'isBase64Encoded': False
            }
    
    airtable_token = os.environ.get('AIRTABLE_TOKEN')
    base_id = os.environ.get('AIRTABLE_BASE_ID')
    table_name = os.environ.get('AIRTABLE_TABLE_NAME', 'Partners')
    
    if not airtable_token or not base_id:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Airtable не настроен'}),
            'isBase64Encoded': False
        }
    
    url = f'https://api.airtable.com/v0/{base_id}/{table_name}'
    headers = {
        'Authorization': f'Bearer {airtable_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'fields': {
            'Name': body_data['name'],
            'Description': body_data['description'],
            'Category': body_data['category'],
            'Offer': body_data['offer'],
            'PromoCode': body_data['promoCode'],
            'URL': body_data['url'],
        }
    }
    
    if body_data.get('logo'):
        payload['fields']['Logo'] = [{'url': body_data['logo']}]
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in [200, 201]:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Ошибка при добавлении в Airtable'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'data': response.json()}),
        'isBase64Encoded': False
    }
