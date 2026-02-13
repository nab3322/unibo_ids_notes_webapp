package com.unibo.notes;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.QuarkusApplication;
import io.quarkus.runtime.annotations.QuarkusMain;
import jakarta.enterprise.context.ApplicationScoped;

@QuarkusMain
public class NotesApplication implements QuarkusApplication {

    public static void main(String... args) {
        Quarkus.run(NotesApplication.class, args);
    }

    @Override
    public int run(String... args) {
        System.out.println("=================================");
        System.out.println("  NOTA BENE Application Started  ");
        System.out.println("=================================");

        Quarkus.waitForExit();
        return 0;
    }
}