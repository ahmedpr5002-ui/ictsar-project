FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Koyeb و Hugging Face يعينان المنفذ تلقائياً، وتطبيقك مهيأ لقراءة process.env.PORT
EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]