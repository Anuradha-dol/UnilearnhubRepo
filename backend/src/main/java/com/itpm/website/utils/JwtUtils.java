package com.itpm.website.utils;

import com.itpm.website.dtos.user.Token;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    @Value("Y2hhbGxlbmdlVG9Xcml0ZUZ1bGxQcmVkaWN0YWJsZVNlY3JldEtleQ==")
    private String secretKey;

    private static final long ACCESS_EXPIRATION_MS = 60 * 60 * 1000;
    private static final long REFRESH_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000L;
    private static final long VERIFY_EXPIRATION_MS = 30 * 60 * 1000;

    public String generateToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            HttpServletResponse response,
            Token tokenType
    ) {

        Map<String, Object> claims = new HashMap<>(extraClaims);
        claims.put("roles", userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));

        long expiration = switch (tokenType) {
            case ACCESS -> ACCESS_EXPIRATION_MS;
            case REFRESH -> REFRESH_EXPIRATION_MS;
            case VERIFY -> VERIFY_EXPIRATION_MS;
        };

        String token = Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey())
                .compact();

        addCookie(response, tokenType, token, expiration);
        return token;
    }

    private void addCookie(HttpServletResponse response, Token type, String token, long expiryMs) {

        String cookie = String.format(
                "%s=%s; Max-Age=%d; Path=/; Secure; HttpOnly; SameSite=None",
                type.name(),
                token,
                expiryMs / 1000
        );

        response.addHeader("Set-Cookie", cookie);
    }


    public String getTokenFromCookie(HttpServletRequest request, Token tokenType) {
        Cookie cookie = WebUtils.getCookie(request, tokenType.name());
        return cookie != null ? cookie.getValue() : null;
    }

    public void removeToken(HttpServletResponse response, Token tokenType) {

        String cookie = String.format(
                "%s=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=None",
                tokenType.name()
        );

        response.addHeader("Set-Cookie", cookie);
    }

    // ---------------- JWT Validation ----------------
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            return extractUsername(token).equals(userDetails.getUsername())
                    && !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

