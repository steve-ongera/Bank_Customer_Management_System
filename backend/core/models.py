from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('teller', 'Teller'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='teller')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} - {self.role}"

class Customer(models.Model):
    ACCOUNT_TYPE_CHOICES = (
        ('savings', 'Savings'),
        ('current', 'Current'),
        ('fixed', 'Fixed Deposit'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('closed', 'Closed'),
    )
    
    customer_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    date_of_birth = models.DateField()
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    account_number = models.CharField(max_length=20, unique=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.account_number}"
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Transaction(models.Model):
    TRANSACTION_TYPE = (
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
    )
    
    transaction_id = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField(blank=True)
    from_account = models.CharField(max_length=20, null=True, blank=True)
    to_account = models.CharField(max_length=20, null=True, blank=True)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_id} - {self.transaction_type} - {self.amount}"

class AccountSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    two_factor_auth = models.BooleanField(default=False)
    language = models.CharField(max_length=10, default='en')
    theme = models.CharField(max_length=10, default='light')
    
    def __str__(self):
        return f"Settings for {self.user.username}"