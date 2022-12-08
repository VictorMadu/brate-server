import RefreshToken from './controllers/user/refresh-token';
import SendOTP from './controllers/user/send-otp';
import SignIn from './controllers/user/sign-in';
import SignUp from './controllers/user/sign-up';
import VerifyOTP from './controllers/user/verify-otp';
import Router from './frameworks/router';
import { Method } from './http/method';

export default class Routes {
    constructor(private router: Router) {}

    addAllPaths() {
        this.router.add('/v1/auth/sign-up', Method.POST, new SignUp());
        this.router.add('/v1/auth/send-otp/:email', Method.POST, new SendOTP());
        this.router.add('/v1/auth/verify-otp/:email', Method.POST, new VerifyOTP());
        this.router.add('/v1/auth/sign-in', Method.POST, new SignIn());
        this.router.add('/v1/auth/refresh', Method.POST, new RefreshToken());
    }
}
