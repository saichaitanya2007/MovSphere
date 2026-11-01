package com.movsphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CompanyRegistrationRequest {
    @NotBlank @Size(max = 150)
    private String companyName;
    @Size(max = 255)
    @Pattern(regexp = "^$|https?://.*", message = "Website must start with http:// or https://")
    private String companyWebsite;
    @NotBlank @Size(max = 100)
    private String userRole;
    @NotBlank @Size(max = 30)
    private String phoneNumber;

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getCompanyWebsite() { return companyWebsite; }
    public void setCompanyWebsite(String companyWebsite) { this.companyWebsite = companyWebsite; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
