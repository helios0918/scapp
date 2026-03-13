package com.example.chatapp.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.chatapp.service.FileStorageService;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.save(file);
        Map<String, String> response = new HashMap<>();
        response.put("fileUrl", url);
        response.put("contentType", file.getContentType());
        response.put("fileName", file.getOriginalFilename());
        return ResponseEntity.ok(response);
    }
}
