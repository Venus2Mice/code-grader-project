"""
Container Pool Manager - Tái sử dụng Docker containers để tối ưu hóa performance

Thay vì tạo container mới cho mỗi submission (2-3s overhead),
chúng ta dùng pool của pre-created containers để giảm overhead xuống ~100-200ms
"""

import docker
import time
import logging
from typing import Optional
from threading import Lock
from .config import Config

logger = logging.getLogger(__name__)


class ContainerPool:
    """Quản lý pool của reusable Docker containers"""
    
    def __init__(self, pool_size: int = 3, image_name: str = "cpp-grader-env"):
        """
        Khởi tạo container pool
        
        Args:
            pool_size: Số lượng containers giữ trong pool (default: 3)
            image_name: Tên Docker image (default: cpp-grader-env)
        """
        self.pool_size = pool_size
        self.image_name = image_name
        self.available_containers = []  # Stack các containers có sẵn
        self.in_use_containers = set()  # Set các containers đang sử dụng
        self.lock = Lock()
        self.docker_client = docker.from_env()
        
        logger.info(f"Initializing ContainerPool with size={pool_size}")
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Tạo các containers sẵn sàng trong pool"""
        try:
            for i in range(self.pool_size):
                try:
                    container = self._create_sandbox_container()
                    self.available_containers.append(container)
                    logger.info(f"Created container {i+1}/{self.pool_size}: {container.short_id}")
                except Exception as e:
                    logger.error(f"Failed to create container {i+1}/{self.pool_size}: {e}")
                    # Tiếp tục tạo các containers khác
                    continue
            
            logger.info(f"Container pool initialized with {len(self.available_containers)} containers")
        except Exception as e:
            logger.error(f"Failed to initialize container pool: {e}")
    
    def _create_sandbox_container(self) -> docker.models.containers.Container:
        """
        Tạo một sandbox container mới
        
        Returns:
            Docker container object
        """
        try:
            # ✅ Use only compatible parameters with docker-py
            container = self.docker_client.containers.run(
                self.image_name,
                command=["sleep", "3600"],
                detach=True,
                mem_limit='256m',
                auto_remove=False,
            )
            logger.debug(f"Created new sandbox container: {container.short_id}")
            return container
        except Exception as e:
            logger.error(f"Error creating sandbox container: {e}")
            raise
    
    def get_container(self, temp_mount_path: str = None) -> Optional[docker.models.containers.Container]:
        """
        Lấy một container từ pool
        
        Args:
            temp_mount_path: Đường dẫn thư mục tạm để mount vào container (optional)
        
        Returns:
            Docker container object hoặc None nếu không thể lấy
        """
        with self.lock:
            # Thử lấy container có sẵn
            while self.available_containers:
                container = self.available_containers.pop()
                
                # Kiểm tra container vẫn chạy bình thường
                try:
                    container.reload()
                    if container.status == 'running':
                        self.in_use_containers.add(container.id)
                        logger.debug(f"Got container from pool: {container.short_id}")
                        return container
                    else:
                        # Container bị dừng/die, xóa và tạo mới
                        logger.warning(f"Container {container.short_id} is not running, removing...")
                        try:
                            container.remove(force=True)
                        except:
                            pass
                except Exception as e:
                    logger.warning(f"Error checking container health: {e}, will create new one")
                    try:
                        container.remove(force=True)
                    except:
                        pass
            
            # Nếu hết container, tạo container mới (nó sẽ được return về pool sau)
            logger.info("No containers in pool, creating new one on-demand")
            try:
                container = self._create_sandbox_container()
                self.in_use_containers.add(container.id)
                return container
            except Exception as e:
                logger.error(f"Failed to create on-demand container: {e}")
                return None
    
    def return_container(self, container: docker.models.containers.Container):
        """
        Return container về pool để tái sử dụng
        
        Args:
            container: Docker container object
        """
        if not container:
            return
        
        with self.lock:
            # Kiểm tra xem container còn khỏe không
            try:
                container.reload()
                
                # 🔧 CRITICAL: Clean up EVERYTHING to avoid memory contamination
                # between submissions using same container
                try:
                    # Remove ALL files in /sandbox including compiled binary
                    container.exec_run("sh -c 'rm -rf /sandbox && mkdir -p /sandbox'", workdir="/")
                    logger.debug(f"Cleaned up container {container.short_id} (deep clean)")
                except Exception as e:
                    logger.warning(f"Error cleaning container: {e}")
                
                if container.status == 'running':
                    # Container vẫn khỏe, return về pool
                    if container.id in self.in_use_containers:
                        self.in_use_containers.remove(container.id)
                    
                    if len(self.available_containers) < self.pool_size:
                        self.available_containers.append(container)
                        logger.debug(f"Returned container to pool: {container.short_id}")
                    else:
                        # Pool đầy, xóa container này
                        try:
                            container.stop()
                            container.remove()
                            logger.debug(f"Pool full, removed container: {container.short_id}")
                        except:
                            pass
                else:
                    # Container bị dừng/die, xóa
                    if container.id in self.in_use_containers:
                        self.in_use_containers.remove(container.id)
                    try:
                        container.remove(force=True)
                        logger.warning(f"Container {container.short_id} not running, removed")
                    except:
                        pass
            except Exception as e:
                logger.error(f"Error returning container to pool: {e}")
                if container.id in self.in_use_containers:
                    self.in_use_containers.remove(container.id)
    
    def shutdown(self):
        """Shutdown pool - dừng và xóa tất cả containers"""
        with self.lock:
            logger.info("Shutting down container pool...")
            
            # Stop và remove available containers
            for container in self.available_containers:
                try:
                    if container.status == 'running':
                        container.stop(timeout=5)
                    container.remove(force=True)
                    logger.debug(f"Stopped and removed container: {container.short_id}")
                except Exception as e:
                    logger.error(f"Error stopping container: {e}")
            
            self.available_containers.clear()
            
            # Stop và remove in-use containers
            for container_id in self.in_use_containers:
                try:
                    container = self.docker_client.containers.get(container_id)
                    if container.status == 'running':
                        container.stop(timeout=5)
                    container.remove(force=True)
                    logger.debug(f"Stopped and removed in-use container: {container_id[:12]}")
                except Exception as e:
                    logger.error(f"Error stopping in-use container: {e}")
            
            self.in_use_containers.clear()
            logger.info("Container pool shutdown complete")
    
    def get_pool_stats(self) -> dict:
        """Lấy thống kê về pool"""
        with self.lock:
            return {
                "available": len(self.available_containers),
                "in_use": len(self.in_use_containers),
                "total": len(self.available_containers) + len(self.in_use_containers),
                "pool_size": self.pool_size
            }


# Global container pool instance
_container_pool: Optional[ContainerPool] = None


def initialize_container_pool(pool_size: int = 3) -> ContainerPool:
    """Khởi tạo global container pool"""
    global _container_pool
    if _container_pool is None:
        _container_pool = ContainerPool(pool_size=pool_size)
    return _container_pool


def get_global_container_pool() -> ContainerPool:
    """Lấy global container pool instance"""
    global _container_pool
    if _container_pool is None:
        _container_pool = initialize_container_pool()
    return _container_pool


def shutdown_container_pool():
    """Shutdown global container pool"""
    global _container_pool
    if _container_pool is not None:
        _container_pool.shutdown()
        _container_pool = None
