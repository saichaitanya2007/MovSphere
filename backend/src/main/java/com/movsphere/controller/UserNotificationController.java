package com.movsphere.controller;

import com.movsphere.entity.UserEntity;
import com.movsphere.entity.UserNotificationEntity;
import com.movsphere.repository.UserNotificationRepository;
import com.movsphere.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class UserNotificationController {
    private final UserNotificationRepository repository;
    private final UserService userService;

    public UserNotificationController(UserNotificationRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<UserNotificationEntity>> getMine(@AuthenticationPrincipal UserDetails details) {
        UserEntity user = userService.findByEmail(details.getUsername());
        return ResponseEntity.ok(repository.findTop50ByRecipientUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<UserNotificationEntity> markAsRead(
            @AuthenticationPrincipal UserDetails details,
            @PathVariable Long id
    ) {
        if (details == null) {
            return ResponseEntity.status(401).build();
        }

        UserEntity user = userService.findByEmail(details.getUsername());
        UserNotificationEntity notification = repository.findByIdAndRecipientUserId(id, user.getId()).orElse(null);
        if (notification == null) {
            return ResponseEntity.notFound().build();
        }

        notification.setRead(true);
        return ResponseEntity.ok(repository.save(notification));
    }
}
