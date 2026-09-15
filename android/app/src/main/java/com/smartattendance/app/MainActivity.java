package com.smartattendance.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebSettings settings = this.bridge.getWebView().getSettings();
                String ua = settings.getUserAgentString();
                if (ua != null) {
                    ua = ua.replace("; wv", "").replaceAll("Version\\/\\d+\\.\\d+\\s*", "");
                    settings.setUserAgentString(ua);
                }
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setSupportMultipleWindows(true);
                settings.setDomStorageEnabled(true);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

