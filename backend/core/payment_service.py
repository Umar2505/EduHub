"""
Payment service integration for Uzbek payment providers (Click, Payme).
"""
import requests
import hashlib
import json
from django.conf import settings
from django.utils import timezone


class PaymentService:
    """Base payment service class."""
    
    def __init__(self):
        self.merchant_id = getattr(settings, 'PAYMENT_MERCHANT_ID', '')
        self.merchant_key = getattr(settings, 'PAYMENT_MERCHANT_KEY', '')
        self.merchant_user_id = getattr(settings, 'PAYMENT_MERCHANT_USER_ID', '')
        self.service_id = getattr(settings, 'PAYMENT_SERVICE_ID', '')
    
    def create_payment(self, amount, order_id, description=''):
        """Create a payment request."""
        raise NotImplementedError
    
    def check_payment_status(self, payment_id):
        """Check payment status."""
        raise NotImplementedError


class ClickPaymentService(PaymentService):
    """Click payment service integration."""
    
    def __init__(self):
        super().__init__()
        self.api_url = 'https://api.click.uz/v2/merchant'
    
    def create_payment(self, amount, order_id, description=''):
        """
        Create Click payment.
        Returns payment URL for redirect.
        """
        try:
            # Click payment creation
            # In production, you would use Click's actual API
            # This is a placeholder structure
            
            timestamp = int(timezone.now().timestamp())
            merchant_trans_id = f"{order_id}_{timestamp}"
            
            # Prepare payment data
            payment_data = {
                'merchant_id': self.merchant_id,
                'merchant_user_id': self.merchant_user_id,
                'service_id': self.service_id,
                'amount': float(amount),
                'transaction_param': str(order_id),
                'merchant_trans_id': merchant_trans_id,
                'return_url': getattr(settings, 'PAYMENT_RETURN_URL', ''),
                'description': description or f'Payment for order {order_id}',
            }
            
            # Generate signature (Click specific)
            # signature = self._generate_signature(payment_data)
            # payment_data['sign_string'] = signature
            
            # In production, make actual API call to Click
            # response = requests.post(f"{self.api_url}/payment/create", json=payment_data)
            
            # For now, return a mock payment URL
            return {
                'success': True,
                'payment_url': f'https://my.click.uz/pay/{merchant_trans_id}',
                'merchant_trans_id': merchant_trans_id,
                'payment_id': merchant_trans_id,
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def check_payment_status(self, payment_id):
        """Check Click payment status."""
        try:
            # In production, make actual API call
            # response = requests.get(f"{self.api_url}/payment/status/{payment_id}")
            
            # Mock response
            return {
                'success': True,
                'status': 'paid',  # or 'pending', 'failed'
                'payment_id': payment_id,
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


class PaymePaymentService(PaymentService):
    """Payme payment service integration."""
    
    def __init__(self):
        super().__init__()
        self.api_url = 'https://checkout.paycom.uz/api'
    
    def create_payment(self, amount, order_id, description=''):
        """
        Create Payme payment.
        Returns payment URL for redirect.
        """
        try:
            # Payme payment creation
            timestamp = int(timezone.now().timestamp() * 1000)
            merchant_trans_id = f"{order_id}_{timestamp}"
            
            # Prepare payment data
            payment_data = {
                'merchant': self.merchant_id,
                'amount': float(amount) * 100,  # Payme uses tiyin (1/100 of sum)
                'account': {
                    'order_id': str(order_id),
                },
                'description': description or f'Payment for order {order_id}',
            }
            
            # Generate signature (Payme specific)
            # signature = self._generate_payme_signature(payment_data)
            
            # In production, make actual API call to Payme
            # response = requests.post(f"{self.api_url}/payment/create", json=payment_data)
            
            # For now, return a mock payment URL
            return {
                'success': True,
                'payment_url': f'https://payme.uz/pay/{merchant_trans_id}',
                'merchant_trans_id': merchant_trans_id,
                'payment_id': merchant_trans_id,
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def check_payment_status(self, payment_id):
        """Check Payme payment status."""
        try:
            # In production, make actual API call
            # response = requests.get(f"{self.api_url}/payment/status/{payment_id}")
            
            # Mock response
            return {
                'success': True,
                'status': 'paid',  # or 'pending', 'failed'
                'payment_id': payment_id,
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


def get_payment_service(provider='click'):
    """Get payment service instance."""
    if provider.lower() == 'click':
        return ClickPaymentService()
    elif provider.lower() == 'payme':
        return PaymePaymentService()
    else:
        raise ValueError(f"Unknown payment provider: {provider}")

