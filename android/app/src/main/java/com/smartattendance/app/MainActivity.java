package com.smartattendance.app;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.os.Message;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private Dialog mWebDialog;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView mainWebView = this.bridge.getWebView();
                WebSettings settings = mainWebView.getSettings();

                String rawUa = settings.getUserAgentString();
                final String customUa = rawUa != null
                        ? rawUa.replace("; wv", "").replaceAll("Version\\/\\d+\\.\\d+\\s*", "")
                        : "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36";
                settings.setUserAgentString(customUa);

                settings.setJavaScriptEnabled(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setSupportMultipleWindows(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);

                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(mainWebView, true);

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    mainWebView.setImportantForAutofill(android.view.View.IMPORTANT_FOR_AUTOFILL_YES);
                }

                mainWebView.setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        Context context = MainActivity.this;
                        WebView popupWebView = new WebView(context);
                        WebSettings popupSettings = popupWebView.getSettings();

                        popupSettings.setJavaScriptEnabled(true);
                        popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);
                        popupSettings.setDomStorageEnabled(true);
                        popupSettings.setDatabaseEnabled(true);
                        popupSettings.setUserAgentString(customUa);

                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            popupWebView.setImportantForAutofill(android.view.View.IMPORTANT_FOR_AUTOFILL_YES);
                        }

                        CookieManager.getInstance().setAcceptCookie(true);
                        CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true);

                        if (mWebDialog != null && mWebDialog.isShowing()) {
                            mWebDialog.dismiss();
                        }

                        mWebDialog = new Dialog(context, android.R.style.Theme_DeviceDefault_Light_NoActionBar_Fullscreen);
                        mWebDialog.setContentView(popupWebView);
                        mWebDialog.setCancelable(true);
                        mWebDialog.show();

                        popupWebView.setWebChromeClient(new WebChromeClient() {
                            @Override
                            public void onCloseWindow(WebView window) {
                                CookieManager.getInstance().flush();
                                if (mWebDialog != null && mWebDialog.isShowing()) {
                                    mWebDialog.dismiss();
                                }
                                window.destroy();
                            }
                        });

                        popupWebView.setWebViewClient(new WebViewClient() {
                            @Override
                            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                                return false;
                            }
                        });

                        WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                        transport.setWebView(popupWebView);
                        resultMsg.sendToTarget();
                        return true;
                    }

                    @Override
                    public void onCloseWindow(WebView window) {
                        CookieManager.getInstance().flush();
                        if (mWebDialog != null && mWebDialog.isShowing()) {
                            mWebDialog.dismiss();
                        }
                        super.onCloseWindow(window);
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}


