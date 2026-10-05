# ==============================================================================
# abstraction.py - Multi-Cloud Storage Abstraction Layer
# ==============================================================================

import os
import shutil
from abc import ABC, abstractmethod
from typing import Optional
from ai_engine.logger import setup_ai_logger

logger = setup_ai_logger("storage_abstraction")


class IStorage(ABC):
    """Abstract interface defining standard interactions with local or cloud storage endpoints."""

    @abstractmethod
    def upload_file(self, local_path: str, remote_path: str) -> bool:
        """Uploads a file to the storage provider."""
        pass

    @abstractmethod
    def download_file(self, remote_path: str, local_path: str) -> bool:
        """Downloads a file from the storage provider."""
        pass

    @abstractmethod
    def delete_file(self, remote_path: str) -> bool:
        """Deletes a file from the storage provider."""
        pass

    @abstractmethod
    def file_exists(self, remote_path: str) -> bool:
        """Checks if a file exists under the remote storage path."""
        pass


class LocalStorage(IStorage):
    """Local file-system based storage implementation."""
    def __init__(self, base_dir: str = "./data/storage") -> None:
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def _resolve_path(self, path: str) -> str:
        return os.path.join(self.base_dir, path.lstrip("/"))

    def upload_file(self, local_path: str, remote_path: str) -> bool:
        dest = self._resolve_path(remote_path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        try:
            shutil.copy2(local_path, dest)
            logger.debug(f"LocalStorage: Uploaded file '{local_path}' to '{dest}'")
            return True
        except Exception as e:
            logger.error(f"LocalStorage: Upload failed: {str(e)}")
            return False

    def download_file(self, remote_path: str, local_path: str) -> bool:
        src = self._resolve_path(remote_path)
        if not os.path.exists(src):
            logger.error(f"LocalStorage: File does not exist: {src}")
            return False
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        try:
            shutil.copy2(src, local_path)
            logger.debug(f"LocalStorage: Downloaded file '{src}' to '{local_path}'")
            return True
        except Exception as e:
            logger.error(f"LocalStorage: Download failed: {str(e)}")
            return False

    def delete_file(self, remote_path: str) -> bool:
        path = self._resolve_path(remote_path)
        if os.path.exists(path):
            try:
                os.remove(path)
                logger.debug(f"LocalStorage: Deleted file '{path}'")
                return True
            except OSError as e:
                logger.error(f"LocalStorage: Deletion failed: {str(e)}")
                return False
        return False

    def file_exists(self, remote_path: str) -> bool:
        return os.path.exists(self._resolve_path(remote_path))


class AWSS3Storage(IStorage):
    """
    AWS S3 Cloud Object Storage integration adapter.
    Uses boto3, falling back gracefully to mock operations if boto3 is not installed or unconfigured.
    """
    def __init__(self, bucket_name: str = "") -> None:
        self.bucket_name = bucket_name or os.getenv("AWS_S3_BUCKET", "visiontrack-s3")
        self._s3_client = None
        self._connect()

    def _connect(self) -> None:
        try:
            import boto3
            self._s3_client = boto3.client("s3")
        except ImportError:
            logger.warning("AWS SDK 'boto3' not detected. S3 storage will run in simulation mode.")
        except Exception as e:
            logger.error(f"Failed to authenticate AWS credentials: {str(e)}")

    def upload_file(self, local_path: str, remote_path: str) -> bool:
        if not self._s3_client:
            logger.info(f"[SIMULATION S3] Uploading '{local_path}' to '{remote_path}'")
            return True
        try:
            self._s3_client.upload_file(local_path, self.bucket_name, remote_path)
            return True
        except Exception as e:
            logger.error(f"AWS S3: Upload failed: {str(e)}")
            return False

    def download_file(self, remote_path: str, local_path: str) -> bool:
        if not self._s3_client:
            logger.info(f"[SIMULATION S3] Downloading '{remote_path}' to '{local_path}'")
            return True
        try:
            self._s3_client.download_file(self.bucket_name, remote_path, local_path)
            return True
        except Exception as e:
            logger.error(f"AWS S3: Download failed: {str(e)}")
            return False

    def delete_file(self, remote_path: str) -> bool:
        if not self._s3_client:
            logger.info(f"[SIMULATION S3] Deleting file '{remote_path}'")
            return True
        try:
            self._s3_client.delete_object(Bucket=self.bucket_name, Key=remote_path)
            return True
        except Exception as e:
            logger.error(f"AWS S3: Deletion failed: {str(e)}")
            return False

    def file_exists(self, remote_path: str) -> bool:
        if not self._s3_client:
            return True
        try:
            self._s3_client.head_object(Bucket=self.bucket_name, Key=remote_path)
            return True
        except Exception:
            return False


class GoogleCloudStorage(IStorage):
    """
    Google Cloud Storage (GCS) adapter.
    Uses google-cloud-storage, with dynamic fallback and mock simulation.
    """
    def __init__(self, bucket_name: str = "") -> None:
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET", "visiontrack-gcs")
        self._gcs_client = None
        self._bucket = None
        self._connect()

    def _connect(self) -> None:
        try:
            from google.cloud import storage
            self._gcs_client = storage.Client()
            self._bucket = self._gcs_client.bucket(self.bucket_name)
        except ImportError:
            logger.warning("GCS SDK 'google-cloud-storage' not detected. GCS storage will run in simulation mode.")
        except Exception as e:
            logger.error(f"Failed to authenticate GCP credentials: {str(e)}")

    def upload_file(self, local_path: str, remote_path: str) -> bool:
        if not self._bucket:
            logger.info(f"[SIMULATION GCS] Uploading '{local_path}' to '{remote_path}'")
            return True
        try:
            blob = self._bucket.blob(remote_path)
            blob.upload_from_filename(local_path)
            return True
        except Exception as e:
            logger.error(f"Google Cloud Storage: Upload failed: {str(e)}")
            return False

    def download_file(self, remote_path: str, local_path: str) -> bool:
        if not self._bucket:
            logger.info(f"[SIMULATION GCS] Downloading '{remote_path}' to '{local_path}'")
            return True
        try:
            blob = self._bucket.blob(remote_path)
            blob.download_to_filename(local_path)
            return True
        except Exception as e:
            logger.error(f"Google Cloud Storage: Download failed: {str(e)}")
            return False

    def delete_file(self, remote_path: str) -> bool:
        if not self._bucket:
            logger.info(f"[SIMULATION GCS] Deleting file '{remote_path}'")
            return True
        try:
            blob = self._bucket.blob(remote_path)
            blob.delete()
            return True
        except Exception as e:
            logger.error(f"Google Cloud Storage: Deletion failed: {str(e)}")
            return False

    def file_exists(self, remote_path: str) -> bool:
        if not self._bucket:
            return True
        try:
            blob = self._bucket.blob(remote_path)
            return blob.exists()
        except Exception:
            return False


class AzureBlobStorage(IStorage):
    """
    Azure Blob Object Storage integration adapter.
    Uses azure-storage-blob, with dynamic fallback and mock simulation.
    """
    def __init__(self, container_name: str = "") -> None:
        self.container_name = container_name or os.getenv("AZURE_CONTAINER", "visiontrack-container")
        self._container_client = None
        self._connect()

    def _connect(self) -> None:
        try:
            from azure.storage.blob import BlobServiceClient
            conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
            if conn_str:
                self._blob_service = BlobServiceClient.from_connection_string(conn_str)
                self._container_client = self._blob_service.get_container_client(self.container_name)
        except ImportError:
            logger.warning("Azure SDK 'azure-storage-blob' not detected. Azure storage will run in simulation mode.")
        except Exception as e:
            logger.error(f"Failed to authenticate Azure Storage: {str(e)}")

    def upload_file(self, local_path: str, remote_path: str) -> bool:
        if not self._container_client:
            logger.info(f"[SIMULATION AZURE] Uploading '{local_path}' to '{remote_path}'")
            return True
        try:
            blob_client = self._container_client.get_blob_client(remote_path)
            with open(local_path, "rb") as data:
                blob_client.upload_blob(data, overwrite=True)
            return True
        except Exception as e:
            logger.error(f"Azure Blob Storage: Upload failed: {str(e)}")
            return False

    def download_file(self, remote_path: str, local_path: str) -> bool:
        if not self._container_client:
            logger.info(f"[SIMULATION AZURE] Downloading '{remote_path}' to '{local_path}'")
            return True
        try:
            blob_client = self._container_client.get_blob_client(remote_path)
            with open(local_path, "wb") as f:
                f.write(blob_client.download_blob().readall())
            return True
        except Exception as e:
            logger.error(f"Azure Blob Storage: Download failed: {str(e)}")
            return False

    def delete_file(self, remote_path: str) -> bool:
        if not self._container_client:
            logger.info(f"[SIMULATION AZURE] Deleting file '{remote_path}'")
            return True
        try:
            blob_client = self._container_client.get_blob_client(remote_path)
            blob_client.delete_blob()
            return True
        except Exception as e:
            logger.error(f"Azure Blob Storage: Deletion failed: {str(e)}")
            return False

    def file_exists(self, remote_path: str) -> bool:
        if not self._container_client:
            return True
        try:
            blob_client = self._container_client.get_blob_client(remote_path)
            return blob_client.exists()
        except Exception:
            return False


# Configuration-driven Factory
class StorageFactory:
    """Instantiates and registers standard or cloud storage providers."""

    @staticmethod
    def get_storage_client(provider: Optional[str] = None) -> IStorage:
        prov = (provider or os.getenv("STORAGE_PROVIDER", "local")).lower()
        if prov == "s3":
            return AWSS3Storage()
        elif prov == "gcs":
            return GoogleCloudStorage()
        elif prov == "azure":
            return AzureBlobStorage()
        return LocalStorage()
