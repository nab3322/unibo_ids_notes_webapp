package com.unibo.notes.service;

import com.unibo.notes.entity.Folder;
import com.unibo.notes.entity.User;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.ResourceNotFoundException;
import com.unibo.notes.exception.ValidationException;
import com.unibo.notes.repository.FolderRepository;
import com.unibo.notes.repository.UserRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@QuarkusTest
class FolderServiceTest {

    @Inject
    FolderService folderService;

    @Inject
    FolderRepository folderRepository;

    @Inject
    UserRepository userRepository;

    private User testUser;

    @BeforeEach
    @Transactional
    void setup() {
        // Pulisci database
        folderRepository.deleteAll();
        userRepository.deleteAll();

        // Crea utente di test
        testUser = new User();
        testUser.username = "testuser";
        testUser.email = "test@example.com";
        testUser.passwordHash = "hash";
        userRepository.persist(testUser);
    }

    @Test
    @Transactional
    void shouldCreateFolder() {
        Folder folder = folderService.createFolder("Test Folder", "Description", null, testUser.id);

        assertThat(folder).isNotNull();
        assertThat(folder.id).isNotNull();
        assertThat(folder.name).isEqualTo("Test Folder");
        assertThat(folder.description).isEqualTo("Description");
        assertThat(folder.owner.id).isEqualTo(testUser.id);
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenCreatingFolderWithEmptyName() {
        assertThatThrownBy(() -> folderService.createFolder("", "Description", null, testUser.id))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("name is required");
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenCreatingDuplicateFolder() {
        folderService.createFolder("Duplicate", "Desc", null, testUser.id);

        assertThatThrownBy(() -> folderService.createFolder("Duplicate", "Desc", null, testUser.id))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @Transactional
    void shouldGetRootFolders() {
        folderService.createFolder("Root1", null, null, testUser.id);
        folderService.createFolder("Root2", null, null, testUser.id);

        List<Folder> rootFolders = folderService.getRootFolders(testUser.id);

        assertThat(rootFolders).hasSize(2);
    }

    @Test
    @Transactional
    void shouldGetSubfolders() {
        Folder parent = folderService.createFolder("Parent", null, null, testUser.id);
        folderService.createFolder("Child1", null, parent.id, testUser.id);
        folderService.createFolder("Child2", null, parent.id, testUser.id);

        List<Folder> subfolders = folderService.getSubfolders(parent.id, testUser.id);

        assertThat(subfolders).hasSize(2);
    }

    @Test
    @Transactional
    void shouldGetFolderById() {
        Folder created = folderService.createFolder("Test", null, null, testUser.id);

        Folder found = folderService.getFolderById(created.id, testUser.id);

        assertThat(found).isNotNull();
        assertThat(found.name).isEqualTo("Test");
    }

    @Test
    @Transactional
    void shouldThrowExceptionWhenFolderNotFound() {
        assertThatThrownBy(() -> folderService.getFolderById(999L, testUser.id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @Transactional
    void shouldUpdateFolder() {
        Folder folder = folderService.createFolder("Old Name", "Old Desc", null, testUser.id);

        Folder updated = folderService.updateFolder(folder.id, "New Name", "New Desc", testUser.id);

        assertThat(updated.name).isEqualTo("New Name");
        assertThat(updated.description).isEqualTo("New Desc");
    }

    @Test
    @Transactional
    void shouldDeleteEmptyFolder() {
        Folder folder = folderService.createFolder("ToDelete", null, null, testUser.id);

        folderService.deleteFolder(folder.id, testUser.id);

        assertThatThrownBy(() -> folderService.getFolderById(folder.id, testUser.id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @Transactional
    void shouldCountNotesByFolder() {
        Folder folder = folderService.createFolder("Test", null, null, testUser.id);

        long count = folderService.countNotesByFolder(folder.id, testUser.id);

        assertThat(count).isEqualTo(0);
    }
}