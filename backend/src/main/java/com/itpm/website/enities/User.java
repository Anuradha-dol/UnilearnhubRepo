package com.itpm.website.enities;

import com.itpm.website.dtos.user.Interest;
import com.itpm.website.dtos.user.Role;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@ToString(exclude = {"tasks", "notifications", "parentUser", "forgotPassword"})
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String firstname;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    private String imageUrl;

    @Column(length = 500)
    private String coverImageUrl;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false)
    private String password;

    @Column(length = 500)
    private String refreshToken;

    private String verifyCode;
    private Date verifyCodeExpiry;

    private Boolean isVerified = false;

    private Date lastOtpSentAt;
    private Integer otpResendCount;
    private Date otpFirstResendTime;
    private Date otpBlockUntil;

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private ForgotPassword forgotPassword;

    @Column(unique = false)
    private String tempEmail; // temporary email

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private Interest interest;



    // Self-referencing relationship
    @ManyToOne
    @JoinColumn(name = "parent_user_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User parentUser;

    // -------------------- UserDetails overrides --------------------
    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    @JsonIgnore
    public String getUsername() {
        return email;
    }

    @Override
    @JsonIgnore
    public @Nullable String getPassword() {
        return password;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isVerified;
    }
}