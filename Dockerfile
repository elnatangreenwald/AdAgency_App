# שלב 1: בניית ה-Frontend (Node.js)
FROM node:20-slim AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# שלב 2: סביבת הריצה של ה-Backend (Python)
FROM python:3.11-slim
WORKDIR /app

# התקנת תלויות מערכת (אם צריך עבור ספריות פייתון מסוימות)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# העתקת דרישות והתקנה
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# העתקת קוד המקור של ה-Backend
COPY . .

# העתקת ה-Frontend הבנוי משלב 1 לתיקייה הנכונה בתוך ה-Flask
COPY --from=build-stage /app/static/dist ./static/dist

# הגדרת משתנה סביבה לפורט (Railway מספקת אותו אוטומטית)
ENV PORT=8080

# שימוש ב-sh -c לוודא הרחבת משתני סביבה
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT}"]
