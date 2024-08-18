import inference # type: ignore 
import cv2
from boxer import Boxer
import os


from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from moviepy.editor import ImageSequenceClip

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed' 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)  
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER 


gred_result = []

gblue_result = []

def draw_circle(frame, pred, colour): 
    x_center = int(pred.x)
    y_center = int(pred.y)
    half_width = int(pred.width/2)
    cv2.circle(frame, (x_center, y_center), half_width, colour, 2)

def draw_bounds(frame, predictions):
    for pred in predictions: 
        if pred.class_name == "Head":
            draw_circle(frame, pred, (0,255,0))
        elif pred.class_name == "Red Gloves":
            draw_circle(frame, pred, (0,0,255))
        elif pred.class_name == "Blue Gloves":
            draw_circle(frame, pred, (255,0,0))
            
def assign_hands(colour, prediction):
    if colour[2] is None: 
        colour[2] = prediction
    else:
        colour[3] = prediction

def assign_domain_range(colour, frame_size) -> list: 
    boxer = colour[0]

    x_centre = int(boxer.x)
    y_centre = int(boxer.y)
    width = int(boxer.width)
    height = int(boxer.height)

    max_height, max_width = frame_size[:2]

    lower_x = max(0, x_centre - width //4)
    upper_x = min(max_width, x_centre + width //4)

    lower_y = max(0, y_centre - height //2 )
    upper_y = min(max_height, y_centre + height //2)

    x_domain = (lower_x, upper_x)
    y_domain = (lower_y, upper_y)

    return (x_domain, y_domain)

def is_within_range(x, values):
    lower_bound = values[0]
    upper_bound = values[1]
    return lower_bound <= x <= upper_bound

def assign_heads(colour, prediction, frame_size):
    col_domain, col_range = assign_domain_range(colour, frame_size)
    for pred in prediction:
        if pred.class_name == "Head":
            head_x = pred.x 
            head_y = pred.y
            if is_within_range(head_x, col_domain) and is_within_range(head_y, col_range):
                colour[1] = pred


def assign_boxer_coord(robo_out, frame_size): # Object detection pred = (x,y,w,h,confidence,class)
    blue = [None] * 4 
    red = [None] * 4
    for pred in robo_out:
        if pred.class_name == "Red-Boxer":
            red[0] = pred 
        elif pred.class_name == "Blue-Boxer":
            blue[0] = pred 
        elif pred.class_name == "Blue Gloves":
            assign_hands(blue, pred)
        elif pred.class_name == "Red Gloves":
            assign_hands(red, pred)
    if blue[0]:
        assign_heads(blue, robo_out, frame_size)
    if red[0]:
        assign_heads(red, robo_out, frame_size)
    return [blue, red]

def seconds_to_mm_ss(seconds):
    # Calculate minutes and seconds
    minutes, seconds = divmod(seconds, 60)
    timestamp = f"{int(minutes):02}:{int(seconds):02}"
    return timestamp

def analyse_result(result:list, fps: float) -> int:
    punch_count = 0
    punching = None
    seq_false = 0

    frames_punched = []
    counter = 0
    for case in result:
        if case:
            if not punching:
                punch_count += 1
                seconds = counter/fps 
                frames_punched.append(seconds_to_mm_ss(seconds))
            punching = True
        elif punching:
            if seq_false >= 5:
                punching = False
                seq_false = 0
        if punching:
            if case == False:
                seq_false += 1
            else:
                seq_false = 0
        counter += 1

    return frames_punched


@app.route('/process', methods=['POST'])
def vidUpload():
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"})

    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"})
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    
    global gred_result
    global gblue_result

    
    gred_result, gblue_result =  process_video(file_path)
    
    
    

    
    
    return jsonify({"message": "file uploaded"}), 200


@app.route('/serve', methods=['GET'])
def upload_video():
    file_name = 'output_video.mp4'
    video_path = os.path.join(app.config['PROCESSED_FOLDER'], file_name)

    if os.path.exists(video_path):
        return send_from_directory(app.config['PROCESSED_FOLDER'], file_name, mimetype='video/mp4')
    


def process_video(file_path):
    cap = cv2.VideoCapture(file_path)
    
    robo = inference.get_model("final-afjkf/4", api_key='VtDfrxz9pyEZq0QS7IKy')
    fpss = cap.get(cv2.CAP_PROP_FPS) # fps 25


    frames = []
    blue_result=[]
    red_result=[]  
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: 
            break
        
        # roboflow detections
        Robo_out = robo.infer(image=frame)
        object_predictions = Robo_out[0].predictions
        blue, red = assign_boxer_coord(object_predictions, frame.shape)[:2]

        # count punches 
        blue_boxer = Boxer(blue)
        red_boxer = Boxer(red)
        blue_result.append(blue_boxer.punch_landed(red_boxer))
        red_result.append(red_boxer.punch_landed(blue_boxer))

        # draw detections 
        draw_bounds(frame, object_predictions)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        frames.append(frame_rgb)
            
        processed_file_path = os.path.join(app.config['PROCESSED_FOLDER'], 'output_video.mp4')
        
        if cv2.waitKey(10) & 0xFF == ord("q"):
            break 
        
    clip = ImageSequenceClip(frames, fps=fpss)
    clip.write_videofile(processed_file_path, codec="libx264")

    red_result = analyse_result(red_result, fpss)
    blue_result = analyse_result(blue_result, fpss)
    
    
    cap.release()
    cv2.destroyAllWindows()
    
    return (red_result, blue_result)


    
@app.route('/timeframe', methods=['GET'])
def request_frame():
        return jsonify({
        "red_timestamps": gred_result,
        "blue_timestamps": gblue_result
    }), 200


    
if __name__ == '__main__':
        app.run(host='0.0.0.0', debug=True, port=8080)


