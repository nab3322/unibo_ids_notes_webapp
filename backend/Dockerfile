# Fase 1: Build con Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copia i file di progetto
COPY pom.xml .
COPY src ./src

# Compila il progetto saltando i test per velocità
RUN mvn clean package -DskipTests

# Fase 2: Runtime (Immagine leggera)
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copia i file compilati dalla fase di build (Struttura Quarkus Fast-Jar)
COPY --from=build /app/target/quarkus-app/lib/ /app/lib/
COPY --from=build /app/target/quarkus-app/*.jar /app/
COPY --from=build /app/target/quarkus-app/app/ /app/app/
COPY --from=build /app/target/quarkus-app/quarkus/ /app/quarkus/

EXPOSE 8080
CMD ["java", "-jar", "quarkus-run.jar"]
