package com.itpm.website.service.user;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.dtos.user.MailBody;
import com.itpm.website.enities.ForgotPassword;
import com.itpm.website.enities.User;
import com.itpm.website.repos.ForgotPasswordRepository;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.utils.EmailUtils;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final ForgotPasswordRepository forgotPasswordRepository;
    private final EmailUtils emailUtils;


    @Override
    public User getCurrentUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    @Override
    public void deleteAccount(User user, UserDto.DeleteAccountDto dto) {
        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        userRepo.delete(user);
    }

    @Transactional
    @Override
    public void requestDeletion(User user) {
        int otp = new Random().nextInt(900_000) + 100_000;
        Date expiration = new Date(System.currentTimeMillis() + 10 * 60 * 1000);

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElse(new ForgotPassword());

        fp.setOtp(otp);
        fp.setExpirationTime(expiration);
        fp.setUser(user);
        forgotPasswordRepository.save(fp);

        try {
            emailUtils.sendMail(new MailBody(
                    user.getEmail(),
                    "OTP for Account Deletion",
                    "Your OTP is: " + otp + " (valid 10 minutes)"
            ));
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP");
        }
    }

    @Transactional
    @Override
    public void verifyAndDelete(User user, UserDto.DeleteAccountForgotVerifyDto dto) {
        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("OTP not requested"));

        if (!fp.getOtp().equals(Integer.parseInt(dto.otp()))) {
            throw new RuntimeException("Invalid OTP");
        }

        if (fp.getExpirationTime().before(new Date())) {
            throw new RuntimeException("OTP expired");
        }

        userRepo.delete(user);
        forgotPasswordRepository.delete(fp);
    }

    @Transactional
    @Override
    public UserDto.UpdateNameDto updateName(User user, UserDto.UpdateNameDto dto) {
        user.setFirstname(dto.name());
        user.setLastName(dto.lastName());
        userRepo.save(user);
        return new UserDto.UpdateNameDto(user.getFirstname(), user.getLastName());
    }

    @Transactional
    @Override
    public UserDto.UpdateEmailDto updateEmail(User user, UserDto.UpdateEmailDto dto) {
        String newEmail = dto.newEmail();

        if (userRepo.findByEmail(newEmail).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        user.setTempEmail(newEmail);
        int otp = new Random().nextInt(900_000) + 100_000;
        user.setVerifyCode(String.valueOf(otp));
        user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        user.setLastOtpSentAt(new Date());

        userRepo.save(user);

        try {
            emailUtils.sendMail(new MailBody(
                    newEmail,
                    "Verify new email",
                    "Your OTP for updating email is: " + otp + " (valid for 5 minutes)"
            ));
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP");
        }

        return new UserDto.UpdateEmailDto(newEmail);
    }

    @Transactional
    @Override
    public void verifyNewEmail(User user, String otp) {
        if (!user.getVerifyCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getVerifyCodeExpiry().before(new Date())) {
            throw new RuntimeException("OTP expired");
        }

        user.setEmail(user.getTempEmail());
        user.setTempEmail(null);
        user.setVerifyCode(null);
        user.setVerifyCodeExpiry(null);
        userRepo.save(user);
    }

    @Transactional
    @Override
    public void updatePassword(User user, UserDto.UpdatePasswordDto dto) {
        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!dto.newPassword().equals(dto.confirmPassword())) {
            throw new RuntimeException("New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepo.save(user);
    }

    @Override
    public UserDto.UserHomeDto getUserHome(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserDto.UserHomeDto(
                "Welcome back, " + user.getFirstname() + "!",
                3, // notifications example
                5  // tasks example
        );
    }

    @Override
    public UserDto.UserProfileDto getProfile(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserDto.UserProfileDto(
                user.getUserId(),
                user.getFirstname(),
                user.getEmail(),
                user.getLastName(),
                user.getRole(),
                user.getInterest(),
                user.getPhoneNumber(),
                user.getTempEmail(),
                user.getImageUrl(),               // profile picture
                user.getCoverImageUrl()
        );
    }
}

