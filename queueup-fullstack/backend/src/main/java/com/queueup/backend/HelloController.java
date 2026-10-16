package com.queueup.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Quick "is the backend running?" check: http://localhost:8080/api/hello
@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public String hello() {
        return "QueueUp backend is running";
    }
}
