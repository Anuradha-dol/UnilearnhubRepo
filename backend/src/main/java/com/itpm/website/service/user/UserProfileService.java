package com.itpm.website.service.user;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.enities.User;

public interface UserProfileService {

    UserDto.UserProfileDto getProfile(Long userId);

    UserDto.UpdateNameDto updateName(User user, UserDto.UpdateNameDto dto);

    UserDto.UpdateEmailDto updateEmail(User user, UserDto.UpdateEmailDto dto);

    void verifyNewEmail(User user, String otp);

    void updatePassword(User user, UserDto.UpdatePasswordDto dto);

    void deleteAccount(User user, UserDto.DeleteAccountDto dto);

    void requestDeletion(User user);

    void verifyAndDelete(User user, UserDto.DeleteAccountForgotVerifyDto dto);

    UserDto.UserHomeDto getUserHome(Long userId);


    User getCurrentUser(String email);

}
