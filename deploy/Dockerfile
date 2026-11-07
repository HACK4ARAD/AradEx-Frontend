# Imaginea web-ului pentru AWS (ECS Fargate, în spatele ALB-ului): build-ul web (`npm run build` → dist/) servit de nginx.
# Construită de .github/workflows/deploy.yml după `npm run build`; infrastructura: AradEx-Infrastructure/terraform.
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/
