package com.smartattendance.app;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {

    @PluginMethod
    public void signIn(PluginCall call) {
        String clientId = call.getString("clientId", "652946018589-ncmoasimhfq3ekdkof9vlbkqettnrstm.apps.googleusercontent.com");

        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(clientId)
                    .requestEmail()
                    .build();

            GoogleSignInClient client = GoogleSignIn.getClient(getActivity(), gso);
            // Sign out first to guarantee the account chooser dialog is always shown
            client.signOut().addOnCompleteListener(getActivity(), task -> {
                Intent signInIntent = client.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleSignInResult");
            });
        } catch (Exception e) {
            call.reject("Failed to initialize Google Sign In: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        Intent data = result.getData();
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            if (account != null) {
                JSObject ret = new JSObject();
                ret.put("idToken", account.getIdToken());
                ret.put("email", account.getEmail());
                ret.put("displayName", account.getDisplayName());
                if (account.getPhotoUrl() != null) {
                    ret.put("photoUrl", account.getPhotoUrl().toString());
                }
                call.resolve(ret);
            } else {
                call.reject("Google Sign In returned empty account.");
            }
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            call.reject("Google Sign In failed with status code " + statusCode + ": " + e.getMessage(), String.valueOf(statusCode), e);
        } catch (Exception e) {
            call.reject("Unexpected error during Google Sign In: " + e.getMessage(), e);
        }
    }
}
