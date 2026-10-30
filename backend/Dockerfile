# Multi-stage production build for BankEase Spring Boot backend
# Stage 1: Build application using Maven wrapper and Java 21
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /app

# Copy Maven wrapper configuration and dependencies descriptor
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Ensure Unix line endings and execute permissions for mvnw
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Pre-fetch project dependencies for layer caching
RUN ./mvnw dependency:go-offline -B || true

# Copy application source code
COPY src ./src

# Build production executable JAR (skipping test execution during image build)
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal, secure production runtime with Java 21 JRE
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create unprivileged application user
RUN groupadd -r bankease && useradd -r -g bankease bankease

# Copy compiled executable JAR from builder stage
COPY --from=builder --chown=bankease:bankease /app/target/*.jar app.jar

# Render assigns PORT dynamically; default to 8080
ENV PORT=8080

# Document listening port
EXPOSE 8080

# Run container as non-root user
USER bankease

# Execute Spring Boot JAR with Render PORT support
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
