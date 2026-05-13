import random
import uuid
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from core.models import User, Customer, Transaction, AccountSettings

class Command(BaseCommand):
    help = 'Seed database with initial bank management system data'

    def generate_customer_id(self):
        return f"CUST{timezone.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"

    def generate_account_number(self):
        return f"ACC{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"

    def generate_transaction_id(self, prefix):
        return f"TXN{prefix}{timezone.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        # Clear existing data (optional)
        self.stdout.write('Clearing existing data...')
        Transaction.objects.all().delete()
        Customer.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()
        
        # Create Users
        self.stdout.write('Creating users...')
        users_data = [
            {
                'username': 'admin_user',
                'email': 'admin@bank.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'phone': '+1234567890',
                'address': '123 Admin Street, City',
                'password': 'admin123',
                'is_staff': True,
                'is_superuser': True
            },
            {
                'username': 'john_manager',
                'email': 'john.manager@bank.com',
                'first_name': 'John',
                'last_name': 'Manager',
                'role': 'manager',
                'phone': '+1234567891',
                'address': '456 Manager Avenue, City',
                'password': 'manager123'
            },
            {
                'username': 'jane_teller',
                'email': 'jane.teller@bank.com',
                'first_name': 'Jane',
                'last_name': 'Teller',
                'role': 'teller',
                'phone': '+1234567892',
                'address': '789 Teller Blvd, City',
                'password': 'teller123'
            },
            {
                'username': 'bob_teller',
                'email': 'bob.teller@bank.com',
                'first_name': 'Bob',
                'last_name': 'Johnson',
                'role': 'teller',
                'phone': '+1234567893',
                'address': '321 Teller Lane, City',
                'password': 'teller123'
            }
        ]

        users = []
        for user_data in users_data:
            password = user_data.pop('password')
            user = User.objects.create(**user_data)
            user.set_password(password)
            user.save()
            users.append(user)
            
            # Create account settings for each user
            AccountSettings.objects.get_or_create(
                user=user,
                defaults={
                    'email_notifications': random.choice([True, False]),
                    'sms_notifications': random.choice([True, False]),
                    'two_factor_auth': False,
                    'language': random.choice(['en', 'es', 'fr']),
                    'theme': random.choice(['light', 'dark'])
                }
            )
            self.stdout.write(f'  - Created user: {user.username} ({user.role})')

        # Create Customers
        self.stdout.write('Creating customers...')
        
        first_names = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 
                       'William', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah', 'Thomas', 'Karen', 'Charles', 'Nancy',
                       'Christopher', 'Lisa', 'Daniel', 'Betty', 'Matthew', 'Margaret', 'Anthony', 'Sandra', 'Donald', 'Ashley']
        
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson']
        
        account_types = ['savings', 'current', 'fixed']
        statuses = ['active', 'active', 'active', 'active', 'inactive', 'suspended']  # More active, few inactive/suspended
        
        customers = []
        customer_count = 50
        
        for i in range(customer_count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            
            # Generate random date of birth (age between 18 and 80)
            birth_year = random.randint(1940, 2002)
            birth_month = random.randint(1, 12)
            birth_day = random.randint(1, 28)
            date_of_birth = datetime(birth_year, birth_month, birth_day).date()
            
            # Random balance between $0 and $50,000
            balance = round(random.uniform(0, 50000), 2)
            
            customer = Customer.objects.create(
                customer_id=self.generate_customer_id(),
                first_name=first_name,
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}@email.com",
                phone=f"+1{random.randint(2000000000, 9999999999)}",
                address=f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Pine', 'Maple', 'Cedar'])} {random.choice(['St', 'Ave', 'Blvd', 'Lane', 'Drive'])}, {random.choice(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'])}, {random.choice(['NY', 'CA', 'IL', 'TX', 'AZ'])} {random.randint(10000, 99999)}",
                date_of_birth=date_of_birth,
                account_type=random.choice(account_types),
                account_number=self.generate_account_number(),
                balance=balance,
                status=random.choice(statuses),
                created_by=random.choice(users)
            )
            customers.append(customer)
            
            if (i + 1) % 10 == 0:
                self.stdout.write(f'  - Created {i + 1}/{customer_count} customers...')
        
        self.stdout.write(self.style.SUCCESS(f'  - Created {len(customers)} customers'))

        # Create Transactions
        self.stdout.write('Creating transactions...')
        
        transaction_types = ['deposit', 'withdrawal', 'transfer']
        descriptions = [
            'Salary deposit', 'ATM withdrawal', 'Online transfer', 'Bill payment',
            'Cash deposit', 'Check deposit', 'Merchant payment', 'Loan payment',
            'Interest credit', 'Fee deduction', 'Transfer to savings', 'Transfer from checking',
            'Dividend payment', 'Rent payment', 'Utility bill', 'Credit card payment'
        ]
        
        transactions_count = 200
        transactions_created = 0
        
        for i in range(transactions_count):
            customer = random.choice(customers)
            transaction_type = random.choice(transaction_types)
            
            # Generate random amount between $10 and $5000
            amount = round(random.uniform(10, 5000), 2)
            
            # Adjust balance for withdrawal
            original_balance = customer.balance
            if transaction_type == 'withdrawal' and original_balance < amount:
                amount = round(original_balance * random.uniform(0.1, 0.9), 2)
            
            if transaction_type == 'deposit':
                new_balance = original_balance + amount
            elif transaction_type == 'withdrawal':
                if original_balance >= amount:
                    new_balance = original_balance - amount
                else:
                    new_balance = original_balance
                    amount = 0
            else:  # transfer
                # For transfer, we'll just simulate it as a withdrawal
                new_balance = original_balance - amount if original_balance >= amount else original_balance
                amount = min(amount, original_balance)
            
            # Random date within the last 90 days
            days_ago = random.randint(0, 90)
            created_at = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            # Update customer balance
            if amount > 0:
                customer.balance = new_balance
                customer.save()
                
                transaction = Transaction.objects.create(
                    transaction_id=self.generate_transaction_id(transaction_type[:3].upper()),
                    customer=customer,
                    transaction_type=transaction_type,
                    amount=amount,
                    description=random.choice(descriptions),
                    from_account=customer.account_number if transaction_type == 'transfer' else None,
                    to_account=f"ACC{random.randint(100000, 999999)}" if transaction_type == 'transfer' else None,
                    balance_after=new_balance,
                    created_by=random.choice(users),
                    created_at=created_at
                )
                transactions_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'  - Created {transactions_created} transactions'))

        # Create additional settings for existing users
        self.stdout.write('Updating user settings...')
        for user in users:
            settings, created = AccountSettings.objects.get_or_create(user=user)
            if not created:
                settings.email_notifications = random.choice([True, False])
                settings.sms_notifications = random.choice([True, False])
                settings.language = random.choice(['en', 'es', 'fr', 'de'])
                settings.theme = random.choice(['light', 'dark'])
                settings.save()
        
        # Generate statistics summary
        total_balance = sum(c.balance for c in customers)
        active_customers = Customer.objects.filter(status='active').count()
        total_deposits = Transaction.objects.filter(transaction_type='deposit').count()
        total_withdrawals = Transaction.objects.filter(transaction_type='withdrawal').count()
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('SEEDING COMPLETED SUCCESSFULLY!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'\n📊 Database Statistics:')
        self.stdout.write(f'  👥 Users Created: {len(users)}')
        self.stdout.write(f'  👤 Customers Created: {len(customers)}')
        self.stdout.write(f'  💰 Active Customers: {active_customers}')
        self.stdout.write(f'  💵 Total Balance: ${total_balance:,.2f}')
        self.stdout.write(f'  📈 Transactions Created: {transactions_created}')
        self.stdout.write(f'     - Deposits: {total_deposits}')
        self.stdout.write(f'     - Withdrawals: {total_withdrawals}')
        self.stdout.write(f'\n🔐 Login Credentials:')
        self.stdout.write(f'  Admin User:')
        self.stdout.write(f'    Username: admin_user')
        self.stdout.write(f'    Password: admin123')
        self.stdout.write(f'\n  Manager User:')
        self.stdout.write(f'    Username: john_manager')
        self.stdout.write(f'    Password: manager123')
        self.stdout.write(f'\n  Teller Users:')
        self.stdout.write(f'    Username: jane_teller, Password: teller123')
        self.stdout.write(f'    Username: bob_teller, Password: teller123')
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))