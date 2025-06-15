import torch
import torchvision.models as models
from torchvision import transforms
import tensorflow as tf
import tensorflowjs as tfjs

def convert_food101_to_tfjs():
    # PyTorch 모델 로드
    model = models.resnet50(pretrained=True)
    model.eval()

    # 모델을 TensorFlow 형식으로 변환
    dummy_input = torch.randn(1, 3, 224, 224)
    torch.onnx.export(model, dummy_input, "food101.onnx")

    # ONNX 모델을 TensorFlow로 변환
    tf_model = tf.keras.models.load_model("food101.onnx")
    
    # TensorFlow.js 형식으로 변환
    tfjs.converters.save_keras_model(tf_model, "public/models/food101")

if __name__ == "__main__":
    convert_food101_to_tfjs() 