# 🧊 Smart Fridge

A **web application** that uses **AI to analyze fridge photos** and generate recipes based on recognized ingredients.  
Built with **Node.js, Express.js, MongoDB** and integrated with **Google Gemini AI**.

---

## 🚀 Features

- 📸 Upload a fridge photo and let AI recognize the products
- 🍽️ Automatic recipe generation based on found ingredients
- ✏️ Manually edit the product list (delete items)
- 📊 Nutritional analysis (calories, proteins, carbs, fats, vegetables)
- 📅 History of previous analyses with products, recipes and analysis
- 👤 Personal characteristics (name, diet type, goal, allergies) for personalized recipes
- 🔑 JWT-based authentication (login/register)
- 🛡️ User roles: User & Admin
- 👨‍💼 Admin panel with full CRUD for user management
- 📱 Responsive UI (mobile-friendly)

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript (ES Modules)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **AI:** Google Gemini API (`@google/genai`)
- **Authentication:** JWT, bcrypt
- **File Upload:** Multer

---

## ⚙️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/RomanJefimov/SmartFridge.git

# Navigate to project folder
cd SmartFridge

# Install dependencies
npm install

# Create .env file and add your keys
cp .env.example .env
```

### Configure `.env`

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key
```

```bash
# Start the server
npm start
```

Open in browser: [http://localhost:3000](http://localhost:3000)


