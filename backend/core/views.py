from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.db import transaction as db_transaction
from django.utils import timezone
import uuid
from .models import User, Customer, Transaction, AccountSettings
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, 
    CustomerSerializer, TransactionSerializer, AccountSettingsSerializer,
    ChangePasswordSerializer
)

class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            AccountSettings.objects.create(user=user)
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        request.auth.delete()
        return Response({'message': 'Logged out successfully'})

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get', 'put'])
    def profile(self, request):
        user = request.user
        if request.method == 'GET':
            return Response(UserSerializer(user).data)
        elif request.method == 'PUT':
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data['old_password']):
                return Response({'old_password': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Customer.objects.all()
        return Customer.objects.filter(created_by=user)
    
    def perform_create(self, serializer):
        customer_id = f"CUST{timezone.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4]}"
        account_number = f"ACC{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6]}"
        serializer.save(
            created_by=self.request.user,
            customer_id=customer_id,
            account_number=account_number
        )
    
    @action(detail=True, methods=['post'])
    def deposit(self, request, pk=None):
        customer = self.get_object()
        amount = request.data.get('amount')
        description = request.data.get('description', '')
        
        if not amount or float(amount) <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            customer.balance += float(amount)
            customer.save()
            
            # FIX: was f"TXN{deposit}..." — `deposit` was an undefined variable
            transaction_id = f"TXNDEP{timezone.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4]}"
            transaction = Transaction.objects.create(
                transaction_id=transaction_id,
                customer=customer,
                transaction_type='deposit',
                amount=amount,
                description=description,
                balance_after=customer.balance,
                created_by=request.user
            )
            
            return Response({
                'customer': CustomerSerializer(customer).data,
                'transaction': TransactionSerializer(transaction).data
            })
    
    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        customer = self.get_object()
        amount = request.data.get('amount')
        description = request.data.get('description', '')
        
        if not amount or float(amount) <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        if customer.balance < float(amount):
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            customer.balance -= float(amount)
            customer.save()
            
            # FIX: was f"TXN{withdrawal}..." — `withdrawal` was an undefined variable
            transaction_id = f"TXNWDR{timezone.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4]}"
            transaction = Transaction.objects.create(
                transaction_id=transaction_id,
                customer=customer,
                transaction_type='withdrawal',
                amount=amount,
                description=description,
                balance_after=customer.balance,
                created_by=request.user
            )
            
            return Response({
                'customer': CustomerSerializer(customer).data,
                'transaction': TransactionSerializer(transaction).data
            })
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        customer = self.get_object()
        transactions = customer.transactions.all().order_by('-created_at')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Transaction.objects.all().order_by('-created_at')
        return Transaction.objects.filter(created_by=user).order_by('-created_at')

class SettingsViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AccountSettingsSerializer
    
    @action(detail=False, methods=['get', 'put'])
    def account_settings(self, request):
        settings, created = AccountSettings.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            return Response(AccountSettingsSerializer(settings).data)
        elif request.method == 'PUT':
            serializer = AccountSettingsSerializer(settings, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)