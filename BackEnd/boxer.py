import math 

class Boxer:
    def __init__(self, colour_list: list):
        # colour list = [boxer, head, hands1, hands2]
        self.boxer = colour_list[0]
        self.head = colour_list[1] 
        self.hands = colour_list[2:] # list of hands

    def punch_landed(self, opponent: "Boxer") -> bool:
        return self.is_overlap(opponent)

    def is_overlap(self, opponent: "Boxer") -> bool: 
        for hand in self.hands:
            if hand and opponent.head:
                hands_x = int(hand.x)
                hands_y = int(hand.y)
                hands_radius = int(hand.width / 2)

                op_head_x = int(opponent.head.x)
                op_head_y = int(opponent.head.y)
                op_head_radius = int(opponent.head.width / 2)

                euclidean_distance = math.sqrt(((op_head_x - hands_x)**2)  + ((op_head_y - hands_y)**2))

                if euclidean_distance <= hands_radius + op_head_radius:
                    return True 

        return False