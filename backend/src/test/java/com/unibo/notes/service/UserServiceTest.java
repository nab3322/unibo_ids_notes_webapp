package com.unibo.notes.service;

import com.unibo.notes.entity.User;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.repository.UserRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.unibo.notes.repository.NoteRepository;
import com.unibo.notes.repository.NotePermissionRepository;

@QuarkusTest
class UserServiceTest {

    @Inject
    UserService userService;

    @Inject
    UserRepository userRepository;

    @Inject
    NoteRepository noteRepository;

    @Inject
    NotePermissionRepository permissionRepository;

    private User testUser;

    @BeforeEach
    @Transactional
    void setup() {
        // Pulisci database nell'ordine corretto
        permissionRepository.deleteAll();
        noteRepository.deleteAll();
        userRepository.deleteAll();

        // Crea utente di test
        testUser = new User();
        testUser.username = "testuser";
        testUser.email = "test@example.com";
        testUser.passwordHash = "hashedpassword";
        userRepository.persist(testUser);
    }

    @Test
    void shouldFindUserById() {
        User found = userService.findById(testUser.id);

        assertThat(found).isNotNull();
        assertThat(found.username).isEqualTo("testuser");
        assertThat(found.email).isEqualTo("test@example.com");
    }

    @Test
    void shouldThrowExceptionWhenUserNotFoundById() {
        assertThatThrownBy(() -> userService.findById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User");
    }

    @Test
    void shouldFindUserByUsername() {
        User found = userService.findByUsername("testuser");

        assertThat(found).isNotNull();
        assertThat(found.id).isEqualTo(testUser.id);
    }

    @Test
    void shouldThrowExceptionWhenUserNotFoundByUsername() {
        assertThatThrownBy(() -> userService.findByUsername("nonexistent"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void shouldFindUserByEmail() {
        User found = userService.findByEmail("test@example.com");

        assertThat(found).isNotNull();
        assertThat(found.username).isEqualTo("testuser");
    }

    @Test
    @Transactional
    void shouldSearchUsersByUsername() {
        // Crea altri utenti
        User user2 = new User();
        user2.username = "testuser2";
        user2.email = "test2@example.com";
        user2.passwordHash = "hash";
        userRepository.persist(user2);

        List<User> results = userService.searchByUsername("test");

        assertThat(results).hasSize(2);
    }

    @Test
    void shouldCheckIfUsernameExists() {
        assertThat(userService.existsByUsername("testuser")).isTrue();
        assertThat(userService.existsByUsername("nonexistent")).isFalse();
    }

    @Test
    void shouldCheckIfEmailExists() {
        assertThat(userService.existsByEmail("test@example.com")).isTrue();
        assertThat(userService.existsByEmail("fake@example.com")).isFalse();
    }
}