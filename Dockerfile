# ---------- Stage 1: Build ----------
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy everything (see .dockerignore: target/, .env, uploads/ and .git are excluded)
COPY . .

# Build the jar
RUN mvn clean package -DskipTests

# ---------- Stage 2: Run ----------
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# The app listens on ${PORT} (default 8081). Pin it to the exposed port so the
# container and EXPOSE agree; override with -e PORT=... if the host requires it.
ENV PORT=8080

# Image uploads are written here — mount a volume on /app/uploads to persist them.
ENV UPLOAD_DIR=/app/uploads/needs

# Expose port
EXPOSE 8080

# No profile is active, so the demo seed in application-dev.yml is never loaded.
# Configure the app with environment variables (DB_URL, JWT_SECRET,
# CORS_ALLOWED_ORIGINS, GEMINI_API_KEY, ...) — never bake a .env into the image.

# Run app
ENTRYPOINT ["java","-jar","app.jar"]
