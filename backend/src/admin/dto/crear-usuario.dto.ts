import { IsEmail, IsInt, IsNotEmpty, IsString, Max, Min, MinLength } from 'class-validator';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombres!: string;

  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido.' })
  correo!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password!: string;

  @IsInt({ message: 'El ID de rol debe ser un número entero.' })
  @Min(1)
  @Max(4)
  idRol!: number;
}
