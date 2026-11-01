package com.movsphere.controller;

import com.movsphere.dto.CompanyRegistrationRequest;
import com.movsphere.entity.CompanyRegistrationEntity;
import com.movsphere.entity.UserEntity;
import com.movsphere.service.UserService;
import com.movsphere.repository.CompanyRegistrationRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company-registrations")
public class CompanyRegistrationController {
    private final CompanyRegistrationRepository repository;
    private final UserService userService;

    public CompanyRegistrationController(CompanyRegistrationRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<CompanyRegistrationEntity> getMine(@AuthenticationPrincipal UserDetails userDetails) {
        UserEntity user = userService.findByEmail(userDetails.getUsername());
        return repository.findByUserId(user.getId())
                .map(company -> ResponseEntity.ok(company))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<CompanyRegistrationEntity> register(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CompanyRegistrationRequest request) {
        UserEntity user = userService.findByEmail(userDetails.getUsername());
        CompanyRegistrationEntity company = repository.findByUserId(user.getId()).orElseGet(CompanyRegistrationEntity::new);
        company.setUserId(user.getId());
        company.setCompanyName(request.getCompanyName().trim());
        company.setCompanyWebsite(request.getCompanyWebsite() == null ? "" : request.getCompanyWebsite().trim());
        company.setUserRole(request.getUserRole().trim());
        company.setPhoneNumber(request.getPhoneNumber().trim());
        return ResponseEntity.ok(repository.save(company));
    }
}
