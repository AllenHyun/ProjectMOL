import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthError {
  getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return "Debe usar otro correo, este ya está en uso";
      case 'auth/weak-password':
        return "La contraseña debe tener al menos 6 caracteres";
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return "El correo o la contraseña son incorrectos. Revise los datos introducidos";
      case 'auth/popup-closed-by-user':
        return "Se ha cerrado la ventana antes de tiempo";
      default:
        console.log("Código de error producido: " + code);
        return "Ocurrió un error. Inténtalo de nuevo más tarde";
    }
  }
}
