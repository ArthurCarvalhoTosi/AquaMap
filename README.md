# AquaMap - Sistema de Localização de Pontos de Água

Aplicação web para localizar, cadastrar e avaliar pontos de água potável de forma colaborativa.

## Tecnologias

### Backend
- **ASP.NET Core 10** (Web API)
- **Entity Framework Core** + **SQLite**
- **Autenticação JWT**
- **Swagger/OpenAPI**

### Frontend
- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS 4**
- **React Leaflet** (OpenStreetMap)
- **Axios**
- **Lucide React** (ícones)
- **PWA** (Service Worker + Manifest)

## Como Executar

### Pré-requisitos
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### Backend (API)

```bash
cd backend
dotnet run
```

A API estará disponível em `http://localhost:5191`.
Swagger UI em `http://localhost:5191/swagger`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O app estará disponível em `http://localhost:5173`.

## Funcionalidades

- **Mapa interativo** com marcadores coloridos por status
- **Geolocalização automática** ao abrir o app
- **Cadastro simplificado** com nome e telefone
- **Adicionar pontos de água** com foto e localização GPS
- **Sistema de verificação comunitária** (5 votos para confirmar)
- **Status em tempo real** ("Tem Água" / "Sem Água")
- **Integração com Google Maps/Waze** para rotas
- **PWA** instalável na tela inicial do celular
- **Cache de tiles** do mapa para uso offline parcial

## Cores dos Marcadores

| Cor | Significado |
|---|---|
| 🟢 Verde | Disponível e Verificado |
| 🟡 Amarelo | Aguardando Confirmação |
| 🔴 Vermelho | Sem Água |

## Regras de Negócio

- Um ponto recém-cadastrado inicia com status "Aguardando Confirmação"
- Após **5 votos de verificação** de usuários diferentes, o ponto recebe o selo "Verificado"
- Se **3 usuários** relatarem "Sem Água" em 1 hora, o status muda automaticamente
- Se **3 usuários** relatarem "Tem Água" em 1 hora, o status volta para "Disponível"
- Cada usuário só pode enviar uma interação do mesmo tipo por hora no mesmo ponto

## Estrutura do Projeto

```
ProjetoPI/
├── backend/                    # ASP.NET Core Web API
│   ├── Controllers/
│   │   ├── AuthController.cs       # Registro e Login
│   │   └── WaterPointsController.cs # CRUD + Interações
│   ├── Models/
│   │   ├── User.cs
│   │   ├── WaterPoint.cs
│   │   └── PointInteraction.cs
│   ├── DTOs/
│   ├── Data/
│   │   └── AppDbContext.cs
│   └── Program.cs
├── frontend/                   # React + Vite PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── WaterMap.tsx        # Mapa com Leaflet
│   │   │   ├── BottomSheet.tsx     # Detalhes do ponto
│   │   │   └── AddPointForm.tsx    # Formulário de cadastro
│   │   ├── pages/
│   │   │   ├── MapPage.tsx         # Tela principal
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── services/
│   │       └── api.ts
│   └── public/
│       ├── manifest.json
│       └── sw.js
└── README.md
```

## API Endpoints

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Cadastro de usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| GET | `/api/waterpoints` | Listar pontos | Não |
| GET | `/api/waterpoints/{id}` | Detalhes de um ponto | Não |
| POST | `/api/waterpoints` | Criar ponto (multipart) | Sim |
| DELETE | `/api/waterpoints/{id}` | Remover ponto | Sim |
| POST | `/api/waterpoints/{id}/interact` | Votar/Reportar status | Sim |
| POST | `/api/waterpoints/{id}/photo` | Upload de foto | Sim |
