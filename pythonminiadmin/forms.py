from django import forms  

class Add(forms.Form):
    host = forms.CharField(label="Host",max_length=255)  
    dbname = forms.CharField(label="Database",max_length=20)  
    dbusr = forms.CharField(label="Username",max_length=100)  
    dbpass = forms.CharField(label="Password",max_length=255)  
    connname = forms.CharField(label="Connection Alias",max_length=100)