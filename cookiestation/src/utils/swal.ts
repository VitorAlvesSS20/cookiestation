import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#FFFFFF',
  color: '#3C2A21', 
  iconColor: '#D4A373', 
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const ConfirmDialog = (title: string, text: string) => {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1A120B', 
    cancelButtonColor: '#E63946', 
    confirmButtonText: 'Sim, confirmar!',
    cancelButtonText: 'Cancelar',
    background: '#FDF8F5', 
    color: '#3C2A21',
  });
};