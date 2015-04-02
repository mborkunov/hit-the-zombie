package energy.zombie;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;

public class ScoreServlet extends HttpServlet {

    public static final String SCORE_PARAM = "score";
    public static final String ACCURACY_PARAM = "accuracy";
    public static final String NAME_PARAM = "name";
    public static final int LIST_MAX_SIZE = 6;
    public static final int MILLIS_IN_WEEK = 7 * 24 * 60 * 60 * 1000;
    private static List<Score> list = new ArrayList<Score>();
    private static final Object lock = new Object();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        writeScoreList(resp);
    }

    private void writeScoreList(HttpServletResponse resp) throws IOException {
        resp.addHeader("Content-Type", "application/json");
        resp.setCharacterEncoding("UTF-8");
        final ServletOutputStream outputStream = resp.getOutputStream();

        outputStream.print("[");

        byte counter = 0;
        for (Score score : list) {
            outputStream.print(score.toJSON());
            if (++counter < list.size()) {
                outputStream.print(',');
            }
        }
        outputStream.print("]");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            final long score = Long.parseLong(req.getParameter(SCORE_PARAM));
            final byte accuracy = Byte.parseByte(req.getParameter(ACCURACY_PARAM));
            final String name = req.getParameter(NAME_PARAM);
            addScore(score, accuracy, name);
            writeScoreList(resp);
        } catch (IllegalArgumentException ignored) {
            // do nothing. ignore this request
        }
    }

    private void addScore(long value, byte accuracy, String name) {
        if (name == null) {
            return;
        }
        if (name.length() > 32) {
            name = name.substring(0, 32);
        }
        synchronized (lock) {
            boolean found = false;
            for (Score score : list) {
                if (score.getDate().getTime() < System.currentTimeMillis() - MILLIS_IN_WEEK) {
                    list.remove(score);
                }
            }

            for (Score score : list) {
                if (score.getName().equals(name)) {
                    found = true;
                    if (value > score.getValue() || (value == score.getValue() && accuracy > score.getAccuracy())) {
                        score.setValue(value);
                        score.setAccuracy(accuracy);
                        score.setDate(new Date());
                    }
                    break;
                }
            }
            if (!found) {
                list.add(new Score(value, accuracy, name));
            }

            Collections.sort(list, new Comparator<Score>() {
                    @Override
                    public int compare(Score o1, Score o2) {
                        if (o1.getValue() == o2.getValue()) {
                            if (o1.getAccuracy() > o2.getAccuracy()) {
                                return -1;
                            } else if (o1.getAccuracy() < o2.getAccuracy()) {
                                return 1;
                            } else if (o1.getAccuracy() == o2.getAccuracy()) {
                                return o1.getDate().compareTo(o2.getDate());
                            }
                            return 0;
                        } else if (o1.getValue() > o2.getValue()) {
                            return -1;
                        }
                        return 1;
                    }
                }
            );


            clearList();
        }
    }

    private void clearList() {
        if (list.size() > LIST_MAX_SIZE) {
            list = list.subList(0, LIST_MAX_SIZE);
        }
    }
}
