# ---- Build stage: compile and package the fat jar ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src src
RUN mvn -q -DskipTests package

# ---- Run stage: only the Java runtime and the jar ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home queueup
COPY --from=build /app/target/*.jar app.jar
USER queueup
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
