# Jak uruchomić aplikację z prawdziwymi tweetami

## 🚀 Uruchamianie aplikacji

### Krok 1: Uruchom backend serwer
W pierwszym terminalu:
```bash
npm run start:backend
```

Backend powinien wyświetlić:
```
✅ Using Bearer Token authentication
Twitter proxy server running on port 3001
```

### Krok 2: Uruchom frontend aplikację  
W drugim terminalu (w głównym katalogu):
```bash
npm start
```

Frontend uruchomi się na http://localhost:4200

## 🧪 Testowanie
1. Otwórz http://localhost:4200
2. Wybierz typ tweetów (publiczne lub moje)
3. Wprowadź nazwę użytkownika (np. "twitter", "nasa", "github")
4. Kliknij "Pobierz tweety"

## 📊 Sprawdzanie statusu

### Backend health check:
http://localhost:3001/health

### Konfiguracja Twitter API:
http://localhost:3001/api/config-check

## 🎯 Dostępne komendy

- `npm run start:backend` - Uruchom backend serwer
- `npm start` - Uruchom frontend z otwarciem przeglądarki
- `npm run dev` - Uruchom frontend bez otwierania przeglądarki

## 🔧 Rozwiązywanie problemów

### Błąd połączenia z backend
- Sprawdź czy backend działa na porcie 3001
- Upewnij się, że widzisz komunikat "Using Bearer Token authentication"

### Błędy Twitter API
- Sprawdź konfigurację w backend/.env
- Sprawdź status na http://localhost:3001/api/config-check
