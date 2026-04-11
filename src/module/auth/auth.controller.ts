import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/Guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ChangePasswordDto } from 'src/dto/change-password.dto';
import { LoginDto } from 'src/dto/login.dto';
import { ResetPasswordDto } from 'src/dto/reset-password.dto';
import { AuthService } from './auth.service';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@User('sub') userId: number, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

}