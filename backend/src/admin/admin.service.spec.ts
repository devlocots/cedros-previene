import { ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let fakeDb: Partial<DatabaseService>;

  beforeEach(() => {
    fakeDb = {
      query: jest.fn(),
      execute: jest.fn(),
    };
    service = new AdminService(fakeDb as DatabaseService);
  });

  it('debe listar roles', async () => {
    (fakeDb.query as jest.Mock).mockResolvedValueOnce([
      { idRol: 1, nombre: 'Tamizaje', descripcion: 'Tamizaje' },
      { idRol: 2, nombre: 'Médico', descripcion: 'Médico' },
    ]);
    const roles = await service.listarRoles();
    expect(roles.length).toBe(2);
  });

  it('debe listar usuarios con rol', async () => {
    (fakeDb.query as jest.Mock).mockResolvedValueOnce([
      {
        id_usuario: 1,
        nombres: 'Juan Perez',
        correo: 'juan@test.com',
        id_rol: 1,
        rol: 'Tamizaje',
        activo: 1,
        fecha_creacion: '2026-10-12',
        ultimo_acceso: null,
      },
    ]);
    const usuarios = await service.listarUsuarios();
    expect(usuarios.length).toBe(1);
    expect(usuarios[0].activo).toBe(true);
    expect(usuarios[0].rol).toBe('Tamizaje');
  });

  it('debe lanzar ConflictException si el correo ya existe al crear usuario', async () => {
    (fakeDb.query as jest.Mock).mockResolvedValueOnce([{ id_usuario: 1 }]);
    await expect(
      service.crearUsuario({
        nombres: 'Test',
        correo: 'test@test.com',
        password: 'password123',
        idRol: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
