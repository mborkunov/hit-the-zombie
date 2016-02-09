package energy.zombie;

import java.util.Date;

public class Score {

    private long value;
    private byte accuracy;
    private int time;
    private String name;
    private Date date;

    public Score(long score, byte accuracy, String name, int time) {
        this(score, accuracy, name, time, new Date());
    }

    private Score(long score, byte accuracy, String name, int time, Date date) {
        setValue(score);
        setAccuracy(accuracy);
        setName(name);
        setTime(time);
        this.date = date;
    }

    public byte getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(byte accuracy) {
        if (accuracy < 0 && accuracy > 100) {
            throw new IllegalArgumentException("illegal accuracy:" + accuracy);
        }
        this.accuracy = accuracy;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.isEmpty() || name.length() > 32) {
            throw new IllegalAccessError("illegal name: " + name);
        }
        this.name = name;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public void setTime(int time) {
        this.time = time;
    }

    public int getTime() {
        return time;
    }

    public long getValue() {
        return value;
    }

    public void setValue(long value) {
        if (value < 0) {
            throw new IllegalArgumentException("illegal score:" + value);
        }
        this.value = value;
    }

    @Override
    public String toString() {
        return "Score{" +
                "value=" + value +
                ", accuracy=" + accuracy +
                ", name='" + name + '\'' +
                ", date=" + date +
                '}';
    }

    public String toJSON() {
        return "{\"accuracy\":" + accuracy + ",\"time\":" + time + ",\"value\":" + value + ",\"name\":" + Util.escape(name) + "}";
    }
}
